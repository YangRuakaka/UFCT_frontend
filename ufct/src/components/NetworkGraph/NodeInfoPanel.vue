/**
 * 节点信息面板组件 - 显示选中节点的详细信息
 */

<template>
  <div class="node-info-panel" v-if="node" :class="{ active: isActive }">
    <div class="panel-header">
      <h3 class="panel-title">{{ title }}</h3>
      <button class="close-btn" @click="closePanel">✕</button>
    </div>

    <div class="panel-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <h4 class="section-title">基本信息</h4>
        <div class="info-item">
          <span class="label">ID:</span>
          <span class="value">{{ node.id }}</span>
        </div>
        <div class="info-item">
          <span class="label">名称:</span>
          <span class="value">{{ node.label || node.id }}</span>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="info-section" v-if="statistics">
        <h4 class="section-title">统计信息</h4>
        <div class="info-item" v-for="(value, key) in statistics" :key="key">
          <span class="label">{{ formatLabel(key) }}:</span>
          <span class="value">{{ value }}</span>
        </div>
      </div>

      <!-- 相邻节点 -->
      <div class="info-section" v-if="neighbors && neighbors.length">
        <h4 class="section-title">相邻节点 ({{ neighbors.length }})</h4>
        <div class="neighbors-list">
          <div class="neighbor-item" v-for="neighbor in neighbors.slice(0, 5)" :key="neighbor.id">
            <span class="neighbor-label">{{ neighbor.label || neighbor.id }}</span>
          </div>
          <div v-if="neighbors.length > 5" class="more-neighbors">
            还有 {{ neighbors.length - 5 }} 个相邻节点...
          </div>
        </div>
      </div>

      <!-- 自定义数据 -->
      <div class="info-section" v-if="customData">
        <h4 class="section-title">详细信息</h4>
        <div class="info-item" v-for="(value, key) in customData" :key="key">
          <span class="label">{{ formatLabel(key) }}:</span>
          <span class="value">{{ formatValue(value) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NodeInfoPanel',
  props: {
    node: {
      type: Object,
      default: null
    },
    neighbors: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: '节点信息'
    }
  },
  data() {
    return {
      isActive: false
    };
  },
  computed: {
    statistics() {
      if (!this.node) return null;
      const stats = {};
      if (this.node.degree !== undefined) stats['度数'] = this.node.degree;
      if (this.node.citations !== undefined) stats['引用次数'] = this.node.citations;
      if (this.node.papers !== undefined) stats['论文数'] = this.node.papers;
      if (this.node.year !== undefined) stats['年份'] = this.node.year;
      return Object.keys(stats).length ? stats : null;
    },
    customData() {
      if (!this.node) return null;
      const excludeKeys = ['id', 'label', 'degree', 'citations', 'papers', 'year', 'x', 'y', 'vx', 'vy', 'fx', 'fy'];
      const data = {};
      Object.entries(this.node).forEach(([key, value]) => {
        if (!excludeKeys.includes(key)) {
          data[key] = value;
        }
      });
      return Object.keys(data).length ? data : null;
    }
  },
  watch: {
    node(newNode) {
      if (newNode) {
        this.isActive = true;
      }
    }
  },
  methods: {
    closePanel() {
      this.$emit('close');
      this.isActive = false;
    },
    formatLabel(key) {
      return key.replace(/([A-Z])/g, ' $1').trim();
    },
    formatValue(value) {
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
    }
  }
};
</script>

<style scoped>
.node-info-panel {
  position: fixed;
  right: -380px;
  top: 20px;
  width: 360px;
  max-height: calc(100vh - 40px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 100;
  transition: right 300ms ease-in-out;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.node-info-panel.active {
  right: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.panel-title {
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
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.panel-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.info-section {
  margin-bottom: 20px;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 13px;
  font-weight: 600;
  color: #1f77b4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.label {
  color: #666;
  font-weight: 500;
  margin-right: 12px;
}

.value {
  color: #333;
  word-break: break-all;
  text-align: right;
  flex: 1;
}

.neighbors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.neighbor-item {
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.more-neighbors {
  padding: 8px 12px;
  font-size: 12px;
  color: #999;
  font-style: italic;
}

@media (max-width: 768px) {
  .node-info-panel {
    right: -100%;
    width: 100%;
    top: 0;
    max-height: 100vh;
    border-radius: 0;
  }

  .node-info-panel.active {
    right: 0;
  }
}
</style>
