<template>
  <div class="network-graph-container">
    <!-- Toolbar -->
    <div class="toolbar">
      <div class="toolbar-left">
        <h2 class="graph-title">{{ title }}</h2>
      </div>
      <div class="toolbar-right">
        <button class="btn btn-sm" @click="resetZoom">
          🔄 Reset View
        </button>
        <button class="btn btn-sm btn-danger" @click="clearGraph" title="Clear all nodes">
          🗑️ Clear All
        </button>
        <button class="btn btn-sm" @click="showStats">
          📊 Statistics
        </button>
      </div>
    </div>

    <!-- Main Container -->
    <div class="main-content">
      <!-- Central Chart -->
      <div class="center-panel">
        <div class="graph-wrapper">
          <div ref="graphContainer" class="graph-container"></div>
          <div v-if="isLoading" class="loading-overlay">
            <div class="spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>

      <!-- Right Info Panel -->
      <NodeInfoPanel 
        :node="selectedNode"
        :neighbors="selectedNodeNeighbors"
        :title="infoTitle"
        :network-type="networkType"
        @close="selectedNode = null"
      />
    </div>

    <!-- Statistics Modal -->
    <div v-if="showStatsModal" class="modal-overlay" @click="showStatsModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Network Statistics</h3>
          <button class="close-btn" @click="showStatsModal = false">✕</button>
        </div>
        <div class="modal-body">
          <div class="stat-row">
            <span class="stat-label">Total Nodes:</span>
            <span class="stat-value">{{ stats.totalNodes }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Total Links:</span>
            <span class="stat-value">{{ stats.totalLinks }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Network Density:</span>
            <span class="stat-value">{{ stats.density.toFixed(4) }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Average Degree:</span>
            <span class="stat-value">{{ stats.avgDegree.toFixed(2) }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Max Degree:</span>
            <span class="stat-value">{{ stats.maxDegree }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Min Degree:</span>
            <span class="stat-value">{{ stats.minDegree }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { WebGLNetworkRenderer } from '../../utils/webglNetworkRenderer';
import NodeInfoPanel from './NodeInfoPanel.vue';
import * as graphUtils from '../../utils/graphUtils';

export default {
  name: 'NetworkGraph',
  components: {
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
      default: 'Node color is assigned based on its degree'
    },
    infoTitle: {
      type: String,
      default: 'Node Information'
    },
    networkType: {
      type: String,
      enum: ['citation', 'collaboration'],
      default: 'citation'
    },
    enableOptimization: {
      type: Boolean,
      default: true
    },
    optimizationThreshold: {
      type: Number,
      default: 2
    },
    apiStats: {
      type: Object,
      default: null
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
      dynamicThreshold: 2,
      maxRenderNodes: 2000,
      lastContainerWidth: 0,
      lastContainerHeight: 0
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
      
      const neighbors = this.nodes.filter(node => neighborIds.has(node.id));
      
      // 🔍 调试日志
      console.log('👥 selectedNodeNeighbors 计算完成:', {
        selectedNodeId: this.selectedNode.id,
        foundNeighborCount: neighbors.length,
        neighbors: neighbors
      });
      
      return neighbors;
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
  },
  methods: {
    initializeRenderer() {
      const container = this.$refs.graphContainer;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      this.renderer = new WebGLNetworkRenderer('.graph-container', {
        width,
        height,
        nodeRadius: 6,
        linkDistance: 150,  // Further increase base link distance
        chargeStrength: -1200,  // Significantly increase repulsion force
        collideRadius: 12
      });

      this.renderer.initialize();
    },
    renderGraph() {
      if (!this.renderer) return;

      this.isLoading = true;

      // Clean data
      let nodesToRender = graphUtils.cleanNodes(this.nodes);
      let linksToRender = graphUtils.cleanLinks(this.links);

      // Dynamically adjust parameters based on node count
      const nodeCount = nodesToRender.length;
      this.adjustOptimizationParameters(nodeCount);

      // Apply optimization
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
        
        // Update performance metrics
        this.performanceMetrics.optimizationLevel = optimized.optimizationLevel || 'none';
      }

      // Calculate styles - based on real node data (citation count, year, etc.)
      const degrees = graphUtils.calculateNodeDegrees(nodesToRender, linksToRender);
      
      // Calculate sizes using real node data
      const sizes = this.calculateNodeSizesFromData(nodesToRender, degrees);
      const colors = this.calculateNodeColorsFromData(nodesToRender);

      // Render
      const startTime = performance.now();

      this.renderer.render(nodesToRender, linksToRender, {
        nodeRadius: (node) => sizes[node.id] || 6,
        nodeColor: (node) => colors[node.id] || '#1f77b4',
        linkColor: () => '#ccc',
        linkWidth: (link) => this.calculateLinkWidth(link)
      });

      // Node click events in Canvas are registered via renderer.on()
      this.renderer.on('nodeClick', (node) => {
        console.log('🖱️ 节点被点击:', node);
        console.log('📊 原始节点数据完整信息:', {
          id: node.id,
          label: node.label,
          title: node.title,
          all_keys: Object.keys(node),
          full_object: node
        });
        this.selectedNode = node;
      });

      const endTime = performance.now();
      this.performanceMetrics.renderTime = Math.round(endTime - startTime);
      this.performanceMetrics.nodeCount = nodesToRender.length;
      this.performanceMetrics.linkCount = linksToRender.length;

      // Calculate statistics
      this.calculateStats(nodesToRender, linksToRender, degrees);

      this.isLoading = false;
    },
    /**
     * Dynamically adjust optimization parameters based on node count
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
    calculateStats(nodes, links, degrees) {
      // Prefer API-returned statistics (calculated from original data)
      if (this.apiStats) {
        console.log('📊 Using API statistics:', this.apiStats);
        
        // Map API fields to local stats object
        this.stats.totalNodes = this.apiStats.total_nodes || nodes.length;
        this.stats.totalLinks = this.apiStats.total_edges || links.length;
        this.stats.density = this.apiStats.network_density || this.calculateDensity(nodes.length, links.length);
        this.stats.avgDegree = this.apiStats.avg_degree || this.calculateAvgDegree(degrees);
        
        // maxDegree and minDegree calculated locally (optimized nodes may be incomplete)
        const degreeValues = Object.values(degrees);
        this.stats.maxDegree = Math.max(...degreeValues, 0);
        this.stats.minDegree = Math.min(...degreeValues, 0);
        
        console.log('✓ Statistics updated:', this.stats);
      } else {
        // If no API statistics, use local calculation
        console.log('⚠ Using locally calculated statistics (no API statistics received)');
        
        this.stats.totalNodes = nodes.length;
        this.stats.totalLinks = links.length;

        const degreeValues = Object.values(degrees);
        this.stats.maxDegree = Math.max(...degreeValues, 0);
        this.stats.minDegree = Math.min(...degreeValues, 0);
        this.stats.avgDegree = degreeValues.length > 0 
          ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length 
          : 0;

        // Calculate density: 2 * |E| / (|V| * (|V| - 1))
        this.stats.density = this.calculateDensity(nodes.length, links.length);
      }
    },
    calculateDensity(nodeCount, linkCount) {
      if (nodeCount > 1) {
        return (2 * linkCount) / (nodeCount * (nodeCount - 1));
      }
      return 0;
    },
    calculateAvgDegree(degrees) {
      const degreeValues = Object.values(degrees);
      return degreeValues.length > 0 
        ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length 
        : 0;
    },
    resetZoom() {
      if (this.renderer) {
        this.renderer.resetZoom();
      }
    },
    showStats() {
      this.showStatsModal = true;
    },
    clearGraph() {
      if (confirm('确定要清空所有节点吗？此操作无法撤销。')) {
        if (this.renderer) {
          this.renderer.clear();
        }
        // 不要直接修改来自父组件的 props（避免 vue/no-mutating-props）
        // 通过事件通知父组件去清空数据；组件内部只清理渲染器与状态
        // 如果父组件绑定了 v-model 或监听 'graph-cleared'，它应该处理实际的数据清空
        this.selectedNode = null;
        this.stats = {
          totalNodes: 0,
          totalLinks: 0,
          density: 0,
          avgDegree: 0,
          maxDegree: 0,
          minDegree: 0
        };
        this.optimizationStats = {
          initialNodes: 0,
          filteredNodes: 0,
          initialLinks: 0,
          filteredLinks: 0,
          compressionRate: 0
        };
        this.$emit('graph-cleared');
      }
    },
    /**
     * 基于真实的节点数据（被引用次数）计算节点大小
     * 使用对数尺度以处理高度倾斜的分布（许多低引用，少数极高引用）
     */
    calculateNodeSizesFromData(nodes) {
      const sizes = {};
      
      if (nodes.length === 0) return sizes;

      // 获取所有节点的引用次数
      const citations = nodes.map(node => node.citations || node.citationCount || 0);
      
      // 使用对数尺度处理高度倾斜的数据
      const logCitations = citations.map(c => Math.log10(c + 1));
      const minLog = Math.min(...logCitations);
      const maxLog = Math.max(...logCitations);
      const logRange = maxLog - minLog || 1;

      // 映射到 4-35 的大小范围
      const MIN_SIZE = 4;
      const MAX_SIZE = 35;
      
      nodes.forEach(node => {
        const citation = node.citations || node.citationCount || 0;
        const logCitation = Math.log10(citation + 1);
        const normalized = (logCitation - minLog) / logRange;
        sizes[node.id] = MIN_SIZE + normalized * (MAX_SIZE - MIN_SIZE);
      });

      return sizes;
    },

    /**
     * 基于真实的节点数据计算节点颜色
     * 使用HSL色轮从蓝色→青色→黄色→红色，表示被引用次数的递增
     * 
     * 颜色编码：
     * - 蓝色 (240°): 0-100 引用
     * - 青色 (180°): 100-1000 引用
     * - 黄色 (60°): 1000-5000 引用
     * - 红色 (0°): >5000 引用
     */
    calculateNodeColorsFromData(nodes) {
      const colors = {};

      if (nodes.length === 0) return colors;

      // 使用对数尺度来确定颜色映射
      const citations = nodes.map(n => n.citations || n.citationCount || 0);
      const maxCitations = Math.max(...citations);
      const logMax = Math.log10(maxCitations + 1);

      nodes.forEach(node => {
        const citation = node.citations || node.citationCount || 0;
        
        // 使用对数归一化
        const normalized = Math.log10(citation + 1) / logMax; // 0-1
        
        // 从蓝色 (240°) 到红色 (0°) 的 HSL 色轮映射
        // 逆序：240° (蓝) → 180° (青) → 60° (黄) → 0° (红)
        const hue = 240 - normalized * 240;
        const saturation = 80; // 保持饱和度
        const lightness = 45 + normalized * 10; // 随着引用数增加，颜色稍微变浅
        
        colors[node.id] = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      });

      return colors;
    },

    /**
     * 计算边的宽度：基于权重（引用计数）
     * 使用平方根尺度使差异更明显但不会过度
     */
    calculateLinkWidth(link) {
      const weight = link.weight || 1;
      // 权重 1 → 0.8px
      // 权重 5 → 1.8px
      // 权重 10+ → 2.8px
      return 0.8 + Math.min(Math.sqrt(weight), 5) * 0.4;
    },
    setupResizeObserver() {
      const container = this.$refs.graphContainer;
      if (!container) return;

      let resizeTimeout;
      const debouncedResize = () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          const width = container.clientWidth;
          const height = container.clientHeight;
          
          // 检查尺寸是否真的改变了，避免不必要的重新渲染
          if (this.lastContainerWidth !== width || this.lastContainerHeight !== height) {
            this.lastContainerWidth = width;
            this.lastContainerHeight = height;
            this.renderer?.resize(width, height);
          }
        }, 150);
      };

      this.resizeObserver = new ResizeObserver(debouncedResize);
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

.btn.btn-danger {
  border-color: #f44336;
  color: #f44336;
}

.btn.btn-danger:hover {
  background: #ffebee;
  border-color: #d32f2f;
  color: #d32f2f;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 12px;
  padding: 12px;
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
