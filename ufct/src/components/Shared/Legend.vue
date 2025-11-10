/**
 * 图例组件 - 显示网络图的图例信息
 */

<template>
  <div class="legend-container">
    <div class="legend-header">
      <h3>图例</h3>
    </div>

    <!-- 节点图例 -->
    <div class="legend-section">
      <h4 class="section-title">节点大小</h4>
      <p class="description">节点大小代表其在网络中的重要性（度数）</p>
      <div class="size-demo">
        <svg width="100%" height="40">
          <circle cx="20" cy="20" r="5" fill="#1f77b4" />
          <text x="32" y="24" font-size="12">低度数</text>
          <circle cx="140" cy="20" r="12" fill="#1f77b4" />
          <text x="160" y="24" font-size="12">中度数</text>
          <circle cx="250" cy="20" r="20" fill="#1f77b4" />
          <text x="278" y="24" font-size="12">高度数</text>
        </svg>
      </div>
    </div>

    <!-- 颜色图例 -->
    <div class="legend-section" v-if="colorScheme">
      <h4 class="section-title">节点颜色</h4>
      <p class="description">{{ colorDescription }}</p>
      <div class="color-demo" v-if="colorScheme === 'degree'">
        <div class="color-item">
          <span class="color-box" style="background-color: #2ca02c;"></span>
          <span>度数低</span>
        </div>
        <div class="color-item">
          <span class="color-box" style="background-color: #1f77b4;"></span>
          <span>度数中</span>
        </div>
        <div class="color-item">
          <span class="color-box" style="background-color: #d62728;"></span>
          <span>度数高</span>
        </div>
      </div>
    </div>

    <!-- 链接图例 -->
    <div class="legend-section">
      <h4 class="section-title">链接</h4>
      <p class="description">连接节点表示关系或交互</p>
      <div class="link-demo">
        <svg width="100%" height="30">
          <line x1="10" y1="15" x2="100" y2="15" stroke="#999" strokeWidth="1" opacity="0.6" />
          <text x="110" y="19" font-size="12">一般关系</text>
        </svg>
        <svg width="100%" height="30">
          <line x1="10" y1="15" x2="100" y2="15" stroke="#1f77b4" strokeWidth="3" />
          <text x="110" y="19" font-size="12">强关系/高亮</text>
        </svg>
      </div>
    </div>

    <!-- 交互说明 -->
    <div class="legend-section">
      <h4 class="section-title">交互操作</h4>
      <ul class="interactions">
        <li><strong>悬停节点</strong>：高亮相关连接</li>
        <li><strong>点击节点</strong>：查看详细信息</li>
        <li><strong>拖动节点</strong>：自由移动位置</li>
        <li><strong>滚动缩放</strong>：放大/缩小视图</li>
        <li><strong>拖动背景</strong>：平移整个网络</li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NetworkLegend',
  props: {
    colorScheme: {
      type: String,
      default: 'degree',
      validator: (value) => ['degree', 'community', 'type'].includes(value)
    },
    colorDescription: {
      type: String,
      default: '节点颜色根据其度数（连接数）分配'
    }
  }
};
</script>

<style scoped>
.legend-container {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 300px;
  font-size: 13px;
  line-height: 1.5;
}

.legend-header {
  margin-bottom: 16px;
  border-bottom: 2px solid #1f77b4;
  padding-bottom: 8px;
}

.legend-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.legend-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.legend-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #1f77b4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.description {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.size-demo,
.color-demo,
.link-demo {
  margin-top: 8px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.color-box {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid #ccc;
}

.interactions {
  margin: 0;
  padding-left: 16px;
  list-style: disc;
}

.interactions li {
  margin-bottom: 6px;
  color: #666;
}

.interactions strong {
  color: #333;
  font-weight: 600;
}

svg {
  display: block;
  width: 100%;
}
</style>
