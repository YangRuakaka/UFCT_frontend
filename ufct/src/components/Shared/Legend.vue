/**
 * Legend Component - Display visualization encoding rules for network graphs
 * 
 * For Citation Networks:
 * - Node Size: Encoded by citation count
 * - Node Color: Encoded by citation count (cool to hot color gradient)
 * - Edge Width: Encoded by weight (number of citations)
 * 
 * For Author Collaboration Networks:
 * - Node Color: All nodes are black (uniform)
 * - Node Size: Encoded by number of collaborations/connections
 * - Edge Width: Encoded by weight (number of collaborative papers)
 */

<template>
  <div class="legend-container">
    <div class="legend-header">
      <h3>Legend</h3>
      <p class="subtitle">{{ legendSubtitle }}</p>
    </div>

    <!-- === CITATION NETWORK LEGEND === -->
    <template v-if="isCitationNetwork">
      <!-- Node Size Encoding -->
      <div class="legend-section">
        <h4 class="section-title">📊 Node Size - Citation Count</h4>
        <p class="description">Node size is proportional to citation count. Larger nodes indicate papers with greater impact</p>
        <div class="size-demo">
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="2" fill="#1f77b4" />
            </svg>
            <span class="label">Low Impact<br/>&lt;100 citations</span>
          </div>
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="5" fill="#1f77b4" />
            </svg>
            <span class="label">Moderate Impact<br/>100-1k citations</span>
          </div>
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="10" fill="#1f77b4" />
            </svg>
            <span class="label">High Impact<br/>1k-10k citations</span>
          </div>
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="15" fill="#1f77b4" />
            </svg>
            <span class="label">Very High Impact<br/>&gt;10k citations</span>
          </div>
        </div>
      </div>

      <!-- Node Color Encoding -->
      <div class="legend-section">
        <h4 class="section-title">🎨 Node Color - Citation Heat Distribution</h4>
        <p class="description">Colors range from cool (blue) to hot (red) to show citation heat. Redder colors indicate more citations</p>
        <div class="color-gradient">
          <div class="gradient-bar"></div>
          <div class="gradient-labels">
            <span>Low Citations</span>
            <span>Moderate Citations</span>
            <span>High Citations</span>
            <span>Very High Citations</span>
          </div>
        </div>
        <div class="color-stats">
          <div class="stat-item">
            <span class="color-dot" style="background: hsl(240, 100%, 40%);"></span>
            <span>Blue (0-100)</span>
          </div>
          <div class="stat-item">
            <span class="color-dot" style="background: hsl(180, 100%, 40%);"></span>
            <span>Cyan (100-1k)</span>
          </div>
          <div class="stat-item">
            <span class="color-dot" style="background: hsl(60, 100%, 50%);"></span>
            <span>Yellow (1k-5k)</span>
          </div>
          <div class="stat-item">
            <span class="color-dot" style="background: hsl(0, 100%, 50%);"></span>
            <span>Red (&gt;5k)</span>
          </div>
        </div>
      </div>

      <!-- Edge Weight Encoding -->
      <div class="legend-section">
        <h4 class="section-title">🔗 Edge Weight - Citation Strength</h4>
        <p class="description">Edge thickness represents citation frequency between papers. Thicker edges indicate more citations</p>
        <div class="edge-demo">
          <div class="edge-item">
            <svg width="100%" height="30">
              <line x1="10" y1="15" x2="120" y2="15" stroke="#999" stroke-width="0.5" opacity="0.7" />
            </svg>
            <span>Thin Edge (1-2 citations)</span>
          </div>
          <div class="edge-item">
            <svg width="100%" height="30">
              <line x1="10" y1="15" x2="120" y2="15" stroke="#666" stroke-width="1.5" opacity="0.8" />
            </svg>
            <span>Medium Edge (3-5 citations)</span>
          </div>
          <div class="edge-item">
            <svg width="100%" height="30">
              <line x1="10" y1="15" x2="120" y2="15" stroke="#333" stroke-width="2.5" opacity="0.9" />
            </svg>
            <span>Thick Edge (6+ citations)</span>
          </div>
        </div>
      </div>
    </template>

    <!-- === AUTHOR COLLABORATION NETWORK LEGEND === -->
    <template v-else>
      <!-- Node Color (Uniform Black) -->
      <div class="legend-section">
        <h4 class="section-title">⚫ Node Color - Uniform Black</h4>
        <p class="description">All author nodes are displayed in black. Color does not encode any information in collaboration networks</p>
        <div class="node-color-demo">
          <svg width="100%" height="60">
            <circle cx="30" cy="30" r="8" fill="#000000" />
            <circle cx="80" cy="30" r="12" fill="#000000" />
            <circle cx="130" cy="30" r="15" fill="#000000" />
            <text x="30" y="50" text-anchor="middle" font-size="11" fill="#666">Small</text>
            <text x="80" y="50" text-anchor="middle" font-size="11" fill="#666">Medium</text>
            <text x="130" y="50" text-anchor="middle" font-size="11" fill="#666">Large</text>
          </svg>
        </div>
      </div>

      <!-- Node Size Encoding -->
      <div class="legend-section">
        <h4 class="section-title">📊 Node Size - Collaboration Network</h4>
        <p class="description">Node size is proportional to the number of collaborators. Larger nodes indicate authors with more collaboration connections</p>
        <div class="size-demo">
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="4" fill="#000000" />
            </svg>
            <span class="label">Few Collaborators<br/>&lt;10</span>
          </div>
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="10" fill="#000000" />
            </svg>
            <span class="label">Regular<br/>10-30</span>
          </div>
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="18" fill="#000000" />
            </svg>
            <span class="label">Active<br/>30-100</span>
          </div>
          <div class="size-item">
            <svg width="80" height="40">
              <circle cx="20" cy="20" r="25" fill="#000000" />
            </svg>
            <span class="label">Highly Connected<br/>&gt;100</span>
          </div>
        </div>
      </div>

      <!-- Edge Weight Encoding -->
      <div class="legend-section">
        <h4 class="section-title">🔗 Edge Weight - Collaboration Strength</h4>
        <p class="description">Edge thickness represents the number of collaborative papers. Thicker edges indicate more collaborations</p>
        <div class="edge-demo">
          <div class="edge-item">
            <svg width="100%" height="30">
              <line x1="10" y1="15" x2="120" y2="15" stroke="#999" stroke-width="0.5" opacity="0.7" />
            </svg>
            <span>Thin Edge (1-2 papers)</span>
          </div>
          <div class="edge-item">
            <svg width="100%" height="30">
              <line x1="10" y1="15" x2="120" y2="15" stroke="#666" stroke-width="1.5" opacity="0.8" />
            </svg>
            <span>Medium Edge (3-5 papers)</span>
          </div>
          <div class="edge-item">
            <svg width="100%" height="30">
              <line x1="10" y1="15" x2="120" y2="15" stroke="#333" stroke-width="2.5" opacity="0.9" />
            </svg>
            <span>Thick Edge (6+ papers)</span>
          </div>
        </div>
      </div>

      <!-- Collaboration Metrics -->
      <div class="legend-section">
        <h4 class="section-title">📈 Author Metrics</h4>
        <p class="description">Information displayed in the author info panel</p>
        <div class="metrics-info">
          <div class="info-item">
            <span class="metric-icon">🤝</span>
            <span class="metric-text"><strong>Collaborations:</strong> Number of co-authors</span>
          </div>
          <div class="info-item">
            <span class="metric-icon">📄</span>
            <span class="metric-text"><strong>Papers:</strong> Total published papers</span>
          </div>
          <div class="info-item">
            <span class="metric-icon">📊</span>
            <span class="metric-text"><strong>H-Index:</strong> Research impact index</span>
          </div>
        </div>
      </div>
    </template>
  </div>  
</template>

<script>
export default {
  name: 'NetworkLegend',
  props: {
    colorScheme: {
      type: String,
      default: 'citation'
    },
    colorDescription: {
      type: String,
      default: '节点颜色根据被引用次数分配'
    },
    networkType: {
      type: String,
      enum: ['citation', 'collaboration'],
      default: 'citation'
    }
  },
  computed: {
    /**
     * 判断是否为引用网络
     */
    isCitationNetwork() {
      return this.networkType === 'citation';
    },

    /**
     * 获取图例副标题
     */
    legendSubtitle() {
      if (this.isCitationNetwork) {
        return 'Visualization encoding based on citation data';
      } else {
        return 'Visualization encoding for author collaboration networks';
      }
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
  width: 100%;
  height: 100%;
  font-size: 12px;
  line-height: 1.6;
  overflow-y: auto;
  overflow-x: hidden;
  box-sizing: border-box;
}

/* 隐藏滚动条但保留滚动功能 - Webkit 浏览器 */
.legend-container::-webkit-scrollbar {
  width: 6px;
}

.legend-container::-webkit-scrollbar-track {
  background: transparent;
}

.legend-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.legend-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Firefox 滚动条 */
.legend-container {
  scrollbar-width: thin;
  scrollbar-color: #ccc transparent;
}

.legend-header {
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #1f77b4;
}

.legend-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 700;
  color: #333;
}

.subtitle {
  margin: 0;
  font-size: 11px;
  color: #999;
  font-style: italic;
}

.legend-section {
  margin-bottom: 18px;
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
  font-weight: 700;
  color: #1f77b4;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.description {
  margin: 0 0 10px 0;
  font-size: 11px;
  color: #666;
  line-height: 1.5;
}

/* 节点大小演示 */
.size-demo {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 4px;
  margin-top: 10px;
}

.size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.size-item svg {
  height: 35px;
  width: 100%;
  flex-shrink: 0;
}

.size-item .label {
  font-size: 9px;
  text-align: center;
  color: #666;
  line-height: 1.2;
  word-break: break-word;
  max-width: 100%;
}

/* 颜色渐变条 */
.color-gradient {
  margin-top: 10px;
}

.gradient-bar {
  height: 24px;
  border-radius: 4px;
  background: linear-gradient(
    to right,
    hsl(240, 100%, 40%) 0%,
    hsl(200, 100%, 40%) 25%,
    hsl(60, 100%, 50%) 50%,
    hsl(30, 100%, 50%) 75%,
    hsl(0, 100%, 50%) 100%
  );
  border: 1px solid #ddd;
  margin-bottom: 8px;
}

.gradient-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #666;
  margin-bottom: 10px;
}

.color-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.color-dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 2px;
  border: 1px solid #ddd;
  flex-shrink: 0;
}

/* 边权重演示 */
.edge-demo {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.edge-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edge-item svg {
  flex: 1;
  height: 30px;
}

.edge-item span {
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  min-width: 80px;
}

/* 列表 */
.optimization-list,
.interactions,
.stats-list {
  margin: 0;
  padding-left: 18px;
  list-style: disc;
}

.optimization-list li,
.interactions li,
.stats-list li {
  margin-bottom: 6px;
  color: #666;
  font-size: 11px;
  line-height: 1.4;
}

.optimization-list strong,
.interactions strong,
.stats-list strong {
  color: #333;
  font-weight: 600;
}

.network-info,
.stats-info {
  background: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
  border-left: 3px solid #1f77b4;
  margin-bottom: 0;
  padding-bottom: 10px;
}

/* 协作网络节点颜色演示 */
.node-color-demo {
  margin-top: 10px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
}

/* 协作网络指标信息 */
.metrics-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: #f9f9f9;
  border-radius: 4px;
  padding: 10px;
  border-left: 3px solid #1f77b4;
  margin-top: 10px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
}

.metric-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.metric-text {
  color: #666;
  line-height: 1.4;
}

.metric-text strong {
  color: #333;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 768px) {
  .legend-container {
    font-size: 11px;
    padding: 12px;
  }

  .size-demo {
    flex-wrap: wrap;
  }

  .size-item svg {
    height: 35px;
  }

  .size-item .label {
    font-size: 9px;
  }
}
</style>
