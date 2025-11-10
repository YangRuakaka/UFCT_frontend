/**
 * 网络图主容器组件 - 整合所有子组件
 */

<template>
  <div class="network-graph-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="graph-title">{{ title }}</h2>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-sm" @click="togglePause" :class="{ paused: isPaused }">
          {{ isPaused ? '▶ 恢复' : '⏸ 暂停' }}
        </button>
        <button class="btn btn-sm" @click="resetZoom">
          🔄 重置视图
        </button>
        <button class="btn btn-sm" @click="exportImage">
          💾 导出图片
        </button>
        <button class="btn btn-sm" @click="showStats">
          📊 统计信息
        </button>
      </div>
    </div>

    <!-- 主容器 -->
    <div class="main-content">
      <!-- 左侧图例 -->
      <div class="left-panel">
        <Legend 
          :colorScheme="colorScheme"
          :colorDescription="colorDescription"
        />
        <OptimizationPanel 
          :stats="optimizationStats"
          :metrics="performanceMetrics"
        />
      </div>

      <!-- 中央图表 -->
      <div class="center-panel">
        <div class="graph-wrapper">
          <div ref="graphContainer" class="graph-container"></div>
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
      </div>

      <!-- 右侧信息面板 -->
      <NodeInfoPanel 
        :node="selectedNode"
        :neighbors="selectedNodeNeighbors"
        :title="infoTitle"
        @close="selectedNode = null"
      />
    </div>

    <!-- 统计信息对话框 -->
    <div v-if="showStatsModal" class="modal-overlay" @click="showStatsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>网络统计信息</h3>
          <button class="close-btn" @click="showStatsModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="stat-row">
            <span class="stat-label">总节点数:</span>
            <span class="stat-value">{{ stats.totalNodes }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">总链接数:</span>
            <span class="stat-value">{{ stats.totalLinks }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">网络密度:</span>
            <span class="stat-value">{{ stats.density.toFixed(4) }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">平均度数:</span>
            <span class="stat-value">{{ stats.avgDegree.toFixed(2) }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最大度数:</span>
            <span class="stat-value">{{ stats.maxDegree }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">最小度数:</span>
            <span class="stat-value">{{ stats.minDegree }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { D3NetworkRenderer } from '../../utils/d3NetworkRenderer';
import Legend from '../Shared/Legend.vue';
import OptimizationPanel from '../Shared/OptimizationPanel.vue';
import NodeInfoPanel from './NodeInfoPanel.vue';
import * as graphUtils from '../../utils/graphUtils';

export default {
  name: 'NetworkGraph',
  components: {
    Legend,
    OptimizationPanel,
    NodeInfoPanel
  },
  props: {
    title: {
      type: String,
      required: true
    },
    nodes: {
      type: Array,
      default: () => []
    },
    links: {
      type: Array,
      default: () => []
    },
    colorScheme: {
      type: String,
      default: 'degree'
    },
    colorDescription: {
      type: String,
      default: '节点颜色根据其度数分配'
    },
    infoTitle: {
      type: String,
      default: '节点信息'
    },
    enableOptimization: {
      type: Boolean,
      default: true
    },
    optimizationThreshold: {
      type: Number,
      default: 2
    }
  },
  data() {
    return {
      renderer: null,
      isLoading: false,
      isPaused: false,
      selectedNode: null,
      showStatsModal: false,
      performanceMetrics: {
        renderTime: 0,
        fps: 60,
        memory: 0,
        nodeCount: 0,
        linkCount: 0,
        optimizationLevel: 'none'
      },
      optimizationStats: {
        initialNodes: 0,
        filteredNodes: 0,
        initialLinks: 0,
        filteredLinks: 0,
        compressionRate: 0
      },
      stats: {
        totalNodes: 0,
        totalLinks: 0,
        density: 0,
        avgDegree: 0,
        maxDegree: 0,
        minDegree: 0
      },
      resizeObserver: null,
      performanceMonitor: null,
      // 动态优化参数
      dynamicThreshold: 2,
      maxRenderNodes: 2000
    };
  },
  computed: {
    selectedNodeNeighbors() {
      if (!this.selectedNode || !this.links) return [];
      
      const neighborIds = new Set();
      this.links.forEach(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        
        if (sourceId === this.selectedNode.id) {
          neighborIds.add(targetId);
        }
        if (targetId === this.selectedNode.id) {
          neighborIds.add(sourceId);
        }
      });
      
      return this.nodes.filter(node => neighborIds.has(node.id));
    }
  },
  watch: {
    nodes: {
      handler() {
        this.renderGraph();
      },
      deep: true
    },
    links: {
      handler() {
        this.renderGraph();
      },
      deep: true
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initializeRenderer();
      this.renderGraph();
      this.setupResizeObserver();
    });
  },
  beforeUnmount() {
    if (this.renderer) {
      this.renderer.clear();
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
    }
  },
  methods: {
    initializeRenderer() {
      const container = this.$refs.graphContainer;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      this.renderer = new D3NetworkRenderer('.graph-container', {
        width,
        height,
        nodeRadius: 6,
        linkDistance: 50,
        chargeStrength: -300,
        collideRadius: 8
      });

      this.renderer.initialize();
    },
    renderGraph() {
      if (!this.renderer) return;

      this.isLoading = true;

      // 清理数据
      let nodesToRender = graphUtils.cleanNodes(this.nodes);
      let linksToRender = graphUtils.cleanLinks(this.links);

      // 根据节点数动态调整参数
      const nodeCount = nodesToRender.length;
      this.adjustOptimizationParameters(nodeCount);

      // 应用优化
      if (this.enableOptimization && nodesToRender.length > 100) {
        this.optimizationStats.initialNodes = nodesToRender.length;
        this.optimizationStats.initialLinks = linksToRender.length;

        const optimized = graphUtils.optimizeGraphForPerformance(
          nodesToRender,
          linksToRender,
          this.dynamicThreshold,
          {
            maxNodes: this.maxRenderNodes,
            preserveTopPercent: nodeCount > 2000 ? 0.1 : 0.15,
            enableCommunityMerge: nodeCount > 1000,
            samplingRate: 1.0
          }
        );

        nodesToRender = optimized.nodes;
        linksToRender = optimized.links;

        this.optimizationStats.filteredNodes = nodesToRender.length;
        this.optimizationStats.filteredLinks = linksToRender.length;
        this.optimizationStats.compressionRate = optimized.compressionRate || 0;
        
        // 更新性能指标
        this.performanceMetrics.optimizationLevel = optimized.optimizationLevel || 'none';
      }

      // 计算样式
      const degrees = graphUtils.calculateNodeDegrees(nodesToRender, linksToRender);
      const sizes = graphUtils.calculateNodeSizes(degrees, 5, 30);
      const colors = graphUtils.generateNodeColors(nodesToRender, linksToRender);

      // 渲染
      const startTime = performance.now();

      this.renderer.render(nodesToRender, linksToRender, {
        nodeRadius: (node) => sizes[node.id] || 6,
        nodeColor: (node) => colors[node.id] || '#1f77b4',
        linkColor: () => '#999',
        linkWidth: () => 1
      });

      // 添加节点点击事件监听
      this.renderer.svg.selectAll('.node').on('click', (event, d) => {
        this.selectedNode = d;
      });

      const endTime = performance.now();
      this.performanceMetrics.renderTime = Math.round(endTime - startTime);
      this.performanceMetrics.nodeCount = nodesToRender.length;
      this.performanceMetrics.linkCount = linksToRender.length;

      // 计算统计信息
      this.calculateStats(nodesToRender, linksToRender, degrees);

      // 启动性能监视
      this.startPerformanceMonitoring();

      this.isLoading = false;
    },
    /**
     * 根据节点数动态调整优化参数
     */
    adjustOptimizationParameters(nodeCount) {
      if (nodeCount <= 500) {
        this.dynamicThreshold = 1;
        this.maxRenderNodes = 500;
      } else if (nodeCount <= 1000) {
        this.dynamicThreshold = 2;
        this.maxRenderNodes = 1000;
      } else if (nodeCount <= 2000) {
        this.dynamicThreshold = 3;
        this.maxRenderNodes = 1500;
      } else if (nodeCount <= 5000) {
        this.dynamicThreshold = 4;
        this.maxRenderNodes = 1500;
      } else {
        this.dynamicThreshold = 5;
        this.maxRenderNodes = 1200;
      }
    },
    /**
     * 启动性能监视
     */
    startPerformanceMonitoring() {
      if (this.performanceMonitor) {
        clearInterval(this.performanceMonitor);
      }

      let frameCount = 0;
      let lastTime = performance.now();

      this.performanceMonitor = setInterval(() => {
        const currentTime = performance.now();
        const deltaTime = (currentTime - lastTime) / 1000;
        const fps = Math.round(frameCount / deltaTime);
        
        this.performanceMetrics.fps = Math.min(fps, 60);
        
        if (performance.memory) {
          this.performanceMetrics.memory = Math.round(performance.memory.usedJSHeapSize / 1048576);
        }

        frameCount = 0;
        lastTime = currentTime;
      }, 1000);
    },
    calculateStats(nodes, links, degrees) {
      this.stats.totalNodes = nodes.length;
      this.stats.totalLinks = links.length;

      const degreeValues = Object.values(degrees);
      this.stats.maxDegree = Math.max(...degreeValues, 0);
      this.stats.minDegree = Math.min(...degreeValues, 0);
      this.stats.avgDegree = degreeValues.length > 0 
        ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length 
        : 0;

      // 计算密度: 2 * |E| / (|V| * (|V| - 1))
      if (nodes.length > 1) {
        this.stats.density = (2 * links.length) / (nodes.length * (nodes.length - 1));
      }
    },
    togglePause() {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        this.renderer?.pause();
      } else {
        this.renderer?.resume();
      }
    },
    resetZoom() {
      if (this.renderer) {
        const startTransform = d3.zoomIdentity
          .translate(0, 0)
          .scale(1);
        
        this.renderer.svg
          .transition()
          .duration(750)
          .call(d3.zoom().transform, startTransform);
      }
    },
    exportImage() {
      if (!this.renderer || !this.renderer.svg) return;

      const svg = this.renderer.svg.node();
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      canvas.width = svg.clientWidth;
      canvas.height = svg.clientHeight;

      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `${this.title}-${Date.now()}.png`;
        link.click();
      };

      img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    },
    showStats() {
      this.showStatsModal = true;
    },
    setupResizeObserver() {
      const container = this.$refs.graphContainer;
      if (!container) return;

      this.resizeObserver = new ResizeObserver(() => {
        this.$nextTick(() => {
          const width = container.clientWidth;
          const height = container.clientHeight;
          this.renderer?.resize(width, height);
        });
      });

      this.resizeObserver.observe(container);
    }
  }
};
</script>

<style scoped>
.network-graph-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
}

.graph-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 14px;
  background: white;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 300ms ease;
}

.btn:hover {
  background: #f0f0f0;
  border-color: #999;
}

.btn.paused {
  background: #fff4e6;
  border-color: #ff9800;
  color: #ff9800;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 12px;
  padding: 12px;
}

.left-panel {
  width: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.center-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 0;
}

.graph-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.graph-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 50;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f0f0f0;
  border-top: 4px solid #1f77b4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-overlay p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

/* 模态框 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  padding: 0;
}

.modal-body {
  padding: 16px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.stat-label {
  font-weight: 500;
  color: #666;
}

.stat-value {
  font-weight: 600;
  color: #1f77b4;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-panel {
    width: 260px;
  }
}

@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
    gap: 0;
  }

  .left-panel {
    width: 100%;
    height: 200px;
    flex-shrink: 0;
    overflow-x: auto;
    overflow-y: hidden;
    display: flex;
    gap: 12px;
  }

  .center-panel {
    flex: 1;
  }

  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }

  .toolbar-right {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
