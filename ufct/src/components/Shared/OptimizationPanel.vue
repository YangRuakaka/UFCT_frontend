/**
 * 性能优化说明面板组件
 */

<template>
  <div class="optimization-panel">
    <div class="panel-header">
      <h3 class="title">⚡ 性能优化方案</h3>
      <button class="collapse-btn" @click="isExpanded = !isExpanded">
        {{ isExpanded ? '▼' : '▶' }}
      </button>
    </div>

    <div class="panel-content" v-if="isExpanded">
      <div class="section">
        <h4>问题分析</h4>
        <p>
          在处理大规模网络数据（数千甚至数万个节点）时，传统的力导向图算法会面临严重的性能问题：
        </p>
        <ul>
          <li>渲染大量 DOM 元素导致页面卡顿</li>
          <li>物理仿真计算复杂度为 O(n²)，n 为节点数</li>
          <li>频繁的屏幕重绘和重排</li>
          <li>内存占用过高导致浏览器崩溃</li>
        </ul>
      </div>

      <div class="section">
        <h4>✓ 已实现的优化方案</h4>
        
        <div class="solution">
          <h5>1. 多层级节点过滤（Multi-tier Node Filtering）</h5>
          <p>
            基于度数的智能多层过滤：动态阈值计算 + 高度数节点保留 + 社区聚合
          </p>
          <div class="formula">
            • 初始节点数：{{ stats.initialNodes }}<br/>
            • 过滤后节点数：{{ stats.filteredNodes }}<br/>
            • 压缩率：<strong>{{ stats.compressionRate || 0 }}%</strong>
          </div>
        </div>

        <div class="solution">
          <h5>2. 链接聚合与清理（Link Aggregation）</h5>
          <p>
            移除自环、重复链接，减少渲染和计算负担。
          </p>
          <div class="formula">
            • 清理前链接数：{{ stats.initialLinks }}<br/>
            • 清理后链接数：{{ stats.filteredLinks }}<br/>
            • 链接减少：{{ stats.initialLinks - stats.filteredLinks }}
          </div>
        </div>

        <div class="solution">
          <h5>3. 自适应仿真参数（Adaptive Simulation）</h5>
          <p>
            根据节点数量自动调整物理仿真参数，减少计算复杂度。
          </p>
          <div class="formula">
            • 节点规模相应参数调整<br/>
            • 力强度动态减弱<br/>
            • 加速冷却过程
          </div>
        </div>

        <div class="solution">
          <h5>4. 细节级别(LOD)渲染（Level of Detail）</h5>
          <p>
            大图自动降低节点大小、简化高亮效果、减少交互事件。
          </p>
        </div>

        <div class="solution">
          <h5>5. 批量更新与增量渲染（Batched Updates）</h5>
          <p>
            分批处理节点和链接的更新，避免一次性DOM操作导致的长时间阻塞。
          </p>
        </div>

        <div class="solution">
          <h5>6. 社区节点合并（Community Merging）</h5>
          <p>
            检测并合并相似的低度节点，保留图的拓扑结构同时减少节点数。
          </p>
        </div>
      </div>

      <div class="section">
        <h4>性能指标</h4>
        <div class="metrics">
          <div class="metric">
            <span class="label">渲染节点数</span>
            <span class="value">{{ metrics.nodeCount || 0 }}</span>
          </div>
          <div class="metric">
            <span class="label">渲染时间</span>
            <span class="value">{{ metrics.renderTime }}ms</span>
          </div>
          <div class="metric">
            <span class="label">FPS</span>
            <span class="value">{{ metrics.fps }}</span>
          </div>
          <div class="metric">
            <span class="label">内存</span>
            <span class="value">{{ metrics.memory }}MB</span>
          </div>
          <div class="metric">
            <span class="label">优化级别</span>
            <span class="value">{{ optimizationLevelText }}</span>
          </div>
          <div class="metric">
            <span class="label">压缩率</span>
            <span class="value">{{ stats.compressionRate || 0 }}%</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h4>使用建议</h4>
        <ul>
          <li>对于 &lt; 1000 节点的网络，可禁用过滤以获得完整可视化</li>
          <li>对于 1000-10000 节点，使用默认过滤参数（阈值=2）</li>
          <li>对于 &gt; 10000 节点，建议提高过滤阈值至 5-10</li>
          <li>使用暂停/恢复功能管理仿真计算</li>
          <li>根据屏幕尺寸调整渲染参数</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OptimizationPanel',
  props: {
    stats: {
      type: Object,
      default: () => ({
        initialNodes: 0,
        filteredNodes: 0,
        initialLinks: 0,
        filteredLinks: 0
      })
    },
    metrics: {
      type: Object,
      default: () => ({
        renderTime: 0,
        fps: 60,
        memory: 0
      })
    }
  },
  data() {
    return {
      isExpanded: false
    };
  },
  computed: {
    compressionRatio() {
      if (this.stats.initialNodes === 0) return 0;
      return Math.round((1 - this.stats.filteredNodes / this.stats.initialNodes) * 100);
    },
    optimizationLevelText() {
      const level = this.metrics.optimizationLevel || 'none';
      const levelMap = {
        'none': '无',
        'light': '轻度',
        'moderate': '中度',
        'heavy': '重度'
      };
      return levelMap[level] || '未知';
    }
  }
};
</script>

<style scoped>
.optimization-panel {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-top: 20px;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;
  user-select: none;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.collapse-btn {
  background: none;
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-content {
  padding: 20px;
  animation: slideDown 300ms ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section {
  margin-bottom: 24px;
}

.section:last-child {
  margin-bottom: 0;
}

.section h4 {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section p {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

.section ul {
  margin: 0;
  padding-left: 20px;
}

.section li {
  margin-bottom: 6px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.solution {
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-left: 3px solid #667eea;
  border-radius: 4px;
}

.solution h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #333;
}

.solution p {
  margin: 0 0 8px 0;
  font-size: 12px;
}

.formula {
  font-size: 12px;
  color: #666;
  font-family: 'Courier New', monospace;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  line-height: 1.6;
  margin-top: 8px;
}

.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.metric {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  text-align: center;
}

.metric .label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.metric .value {
  font-size: 14px;
  font-weight: 600;
  color: #667eea;
}

@media (max-width: 768px) {
  .metrics {
    grid-template-columns: 1fr;
  }
  
  .solution {
    margin-bottom: 12px;
  }
}
</style>
