/**
 * Node Information Panel - Display detailed information about papers/authors
 */

<template>
  <div class="node-info-panel" v-if="node" :class="{ active: isActive }">
    <div class="panel-header">
      <h3 class="panel-title">{{ title }}</h3>
      <button class="close-btn" @click="closePanel">✕</button>
    </div>

    <div class="panel-content">
      <!-- Header -->
      <div class="paper-header">
        <h2 class="paper-title">{{ node.title || node.label }}</h2>
        <div class="id-badge">{{ node.id.substring(node.id.lastIndexOf('/') + 1) }}</div>
      </div>

      <!-- === PAPER/CITATION NETWORK VIEW === -->
      <template v-if="isPaperNetwork">
        <!-- Key Metrics Cards -->
        <div class="metrics-cards">
          <div class="metric-card">
            <span class="metric-label">Citation Count</span>
            <span class="metric-value">{{ node.citations || node.citationCount || 0 }}</span>
            <span class="metric-rank">{{ getCitationRank(node.citations || node.citationCount || 0) }}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Publication Year</span>
            <span class="metric-value">{{ node.year || 'N/A' }}</span>
            <span class="metric-rank">{{ getYearCategory(node.year) }}</span>
          </div>
        </div>

        <!-- Basic Information -->
        <div class="info-section">
          <h4 class="section-title">📄 Basic Information</h4>
          
          <div class="info-row">
            <span class="info-label">Publication Venue:</span>
            <span class="info-value">{{ node.venue || 'Unknown' }}</span>
          </div>

          <div class="info-row" v-if="node.url">
            <span class="info-label">Paper Link:</span>
            <a :href="node.url" target="_blank" class="info-link">
              View in OpenAlex →
            </a>
          </div>

          <div class="info-row" v-if="node.metadata && node.metadata.citation_type">
            <span class="info-label">Citation Type:</span>
            <span class="info-value">{{ node.metadata.citation_type }}</span>
          </div>
        </div>

        <!-- Impact Analysis -->
        <div class="info-section">
          <h4 class="section-title">⭐ Impact Analysis</h4>
          
          <div class="impact-bar">
            <div class="bar-label">
              <span>Citation Impact Score</span>
              <span class="bar-value">{{ getCitationPercentile(node.citations || node.citationCount || 0) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: getCitationPercentile(node.citations || node.citationCount || 0) + '%' }"></div>
            </div>
          </div>

          <div class="impact-description">
            <p v-if="(node.citations || node.citationCount || 0) > 10000">
              ✨ <strong>Exceptional Impact</strong> - This is a highly influential paper with broad citations
            </p>
            <p v-else-if="(node.citations || node.citationCount || 0) > 1000">
              ⭐ <strong>High Impact</strong> - This is a significantly influential paper
            </p>
            <p v-else-if="(node.citations || node.citationCount || 0) > 100">
              🌟 <strong>Moderate Impact</strong> - This is a paper with notable influence
            </p>
            <p v-else>
              📝 <strong>Standard Paper</strong> - This is a regular academic paper
            </p>
          </div>
        </div>

        <!-- Adjacent Nodes (Citation Relationships) -->
        <div class="info-section" v-if="neighbors && neighbors.length">
          <h4 class="section-title">🔗 Related Papers ({{ neighbors.length }})</h4>
          <p class="section-desc">Other papers with direct citation relationships to this paper</p>
          <div class="neighbors-list">
            <div class="neighbor-item" v-for="neighbor in neighbors.slice(0, 5)" :key="neighbor.id">
              <div class="neighbor-title">{{ neighbor.label || neighbor.title }}</div>
              <div class="neighbor-meta">
                {{ neighbor.year }} · {{ neighbor.citations || neighbor.citationCount || 0 }} citations
              </div>
            </div>
            <div v-if="neighbors.length > 5" class="more-neighbors">
              + {{ neighbors.length - 5 }} other papers...
            </div>
          </div>
        </div>
      </template>

      <!-- === AUTHOR COLLABORATION NETWORK VIEW === -->
      <template v-else>
        <!-- Author Basic Information (from API metadata) -->
        <div class="info-section">
          <h4 class="section-title">👤 Author Information</h4>
          
          <div class="info-row">
            <span class="info-label">Author Name:</span>
            <span class="info-value">{{ node.name || node.label }}</span>
          </div>

          <div class="info-row">
            <span class="info-label">ORCID:</span>
            <!-- 如果 orcid 是有效的 URL 链接，显示为可点击的链接 -->
            <a v-if="node.orcid && node.orcid.includes('orcid.org')" 
               :href="node.orcid" 
               target="_blank" 
               class="info-link">
              {{ node.orcid.substring(node.orcid.lastIndexOf('/') + 1) }} →
            </a>
            <!-- 否则显示文本（可能是空字符串或 N/A） -->
            <span v-else class="info-value">{{ node.orcid || 'N/A' }}</span>
          </div>
        </div>

        <!-- Collaborators List (if available) -->
        <div class="info-section" v-if="neighbors && neighbors.length">
          <h4 class="section-title">👥 Collaborators ({{ neighbors.length }})</h4>
          <p class="section-desc">Co-authors with direct collaboration connections</p>
          <div class="neighbors-list">
            <div class="neighbor-item" v-for="neighbor in neighbors.slice(0, 5)" :key="neighbor.id">
              <div class="neighbor-title">{{ neighbor.name || neighbor.label }}</div>
              <div class="neighbor-meta">
                {{ neighbor.paperCount || 0 }} papers
              </div>
            </div>
            <div v-if="neighbors.length > 5" class="more-neighbors">
              + {{ neighbors.length - 5 }} other collaborators...
            </div>
          </div>
        </div>
      </template>

      <!-- Detailed Metadata -->
      <div class="info-section" v-if="node.metadata">
        <h4 class="section-title">🔍 Raw Metadata</h4>
        <div class="metadata-json">
          <pre>{{ JSON.stringify(node.metadata, null, 2) }}</pre>
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
      default: '论文信息'
    },
    maxCitations: {
      type: Number,
      default: 100000
    },
    networkType: {
      type: String,
      enum: ['citation', 'collaboration'],
      default: 'citation'
    }
  },
  data() {
    return {
      isActive: false
    };
  },
  computed: {
    /**
     * 判断是否为论文网络（否则为协作网络）
     */
    isPaperNetwork() {
      return this.networkType === 'citation' || (this.node && this.node.nodeType === 'paper');
    }
  },
  watch: {
    node(newNode) {
      if (newNode) {
        this.isActive = true;
        // 🔍 调试日志：记录节点数据
        console.log('📍 NodeInfoPanel - 节点数据更新:', {
          id: newNode.id,
          label: newNode.label,
          title: newNode.title,
          isPaperNetwork: this.isPaperNetwork,
          networkType: this.networkType,
          // 作者信息
          name: newNode.name,
          orcid: newNode.orcid,
          orcid_from_metadata: newNode.metadata?.orcid,
          paperCount: newNode.paperCount,
          // 论文网络字段
          citations: newNode.citations,
          citationCount: newNode.citationCount,
          year: newNode.year,
          venue: newNode.venue,
          url: newNode.url,
          nodeType: newNode.nodeType,
          // 作者协作网络字段
          collaborations: newNode.collaborations,
          papers: newNode.papers,
          hIndex: newNode.hIndex,
          // 其他字段
          metadata: newNode.metadata,
          allKeys: Object.keys(newNode)
        });
        
        // 特别调试 ORCID 字段
        console.log('🔗 ORCID 调试信息:', {
          'node.orcid': newNode.orcid,
          'metadata.orcid': newNode.metadata?.orcid,
          'orcid 类型': typeof newNode.orcid,
          'orcid 长度': newNode.orcid?.length,
          'orcid 是否为空': newNode.orcid === '' || newNode.orcid === null || newNode.orcid === undefined
        });
        
        // 完整的数据表格显示（便于复制查看）
        console.table({
          字段: [
            'isPaperNetwork (论文网络?)',
            'networkType (网络类型)',
            'id (作者/论文ID)',
            'label (显示名称)',
            'name (作者名)',
            'orcid (ORCID)',
            'paperCount (论文数)',
            'collaborations (协作数)',
            'papers (论文数)',
            'hIndex (H指数)',
            'citations (引用数)',
            'year (年份)'
          ],
          值: [
            this.isPaperNetwork,
            this.networkType,
            newNode.id?.substring(0, 30),
            newNode.label,
            newNode.name,
            newNode.orcid,
            newNode.paperCount,
            newNode.collaborations,
            newNode.papers,
            newNode.hIndex,
            newNode.citations,
            newNode.year
          ]
        });
      }
    }
  },
  methods: {
    closePanel() {
      this.$emit('close');
      this.isActive = false;
    },

    /**
     * ===== 论文网络方法 =====
     */

    /**
     * Get citation rank description
     */
    getCitationRank(citations) {
      if (citations > 50000) return '🏆 Legendary';
      if (citations > 10000) return '💎 Very High';
      if (citations > 1000) return '⭐ High';
      if (citations > 100) return '✨ Medium';
      if (citations > 10) return '📊 Low';
      return '📝 New';
    },

    /**
     * Get year category
     */
    getYearCategory(year) {
      if (!year) return 'N/A';
      const now = new Date().getFullYear();
      const age = now - year;
      
      if (age < 2) return '🔥 Recent';
      if (age < 5) return '⏰ Current';
      if (age < 10) return '📅 Mid-term';
      return '📚 Classic';
    },

    /**
     * Calculate citation percentile (for progress bar)
     */
    getCitationPercentile(citations) {
      // Use logarithmic scale because citation distribution is highly skewed
      const logCitations = Math.log10(citations + 1);
      const logMax = Math.log10(this.maxCitations);
      return Math.min(Math.round((logCitations / logMax) * 100), 100);
    },


  }
};
</script>

<style scoped>
.node-info-panel {
  position: fixed;
  right: -420px;
  top: 20px;
  width: 400px;
  max-height: calc(100vh - 40px);
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 100;
  transition: right 300ms ease-in-out;
  overflow: hidden;
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
  background: linear-gradient(135deg, #1f77b4 0%, #0d47a1 100%);
  flex-shrink: 0;
}

.panel-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: white;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 200ms ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 论文标题 */
.paper-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0;
}

.paper-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 700;
  color: #333;
  line-height: 1.4;
  word-wrap: break-word;
}

.id-badge {
  font-size: 10px;
  color: #999;
  font-family: monospace;
  background: #f5f5f5;
  padding: 4px 8px;
  border-radius: 3px;
  display: inline-block;
  margin-top: 4px;
}

/* 指标卡 */
.metrics-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 16px;
}

.metric-card {
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
  transition: all 200ms ease;
}

.metric-card:hover {
  background: linear-gradient(135deg, #ebebeb 0%, #f9f9f9 100%);
  border-color: #1f77b4;
  box-shadow: 0 2px 8px rgba(31, 119, 180, 0.1);
}

.metric-label {
  display: block;
  font-size: 11px;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.metric-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f77b4;
  margin-bottom: 4px;
}

.metric-rank {
  display: block;
  font-size: 11px;
  color: #999;
}

/* 信息区块 */
.info-section {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 3px solid #1f77b4;
}

.section-title {
  margin: 0 0 10px 0;
  font-size: 12px;
  font-weight: 700;
  color: #333;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-desc {
  margin: 0 0 10px 0;
  font-size: 11px;
  color: #666;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
}

.info-label {
  color: #666;
  font-weight: 600;
  margin-right: 8px;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  text-align: right;
  flex: 1;
  word-break: break-word;
}

.info-link {
  color: #1f77b4;
  text-decoration: none;
  cursor: pointer;
  transition: all 200ms ease;
  font-weight: 600;
}

.info-link:hover {
  color: #0d47a1;
  text-decoration: underline;
}

/* 影响力分析 */
.impact-bar {
  margin-bottom: 10px;
}

.bar-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
}

.bar-value {
  color: #1f77b4;
  font-weight: 700;
}

.progress-bar {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1f77b4, #00bcd4, #4caf50, #ffc107, #ff5722);
  background-size: 200% 100%;
  transition: all 300ms ease;
}

.impact-description {
  margin-top: 10px;
}

.impact-description p {
  margin: 0;
  font-size: 11px;
  color: #666;
  line-height: 1.5;
}

.impact-description strong {
  color: #333;
  font-weight: 700;
}

/* 相邻论文列表 */
.neighbors-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.neighbor-item {
  padding: 10px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 11px;
  transition: all 200ms ease;
}

.neighbor-item:hover {
  border-color: #1f77b4;
  box-shadow: 0 2px 6px rgba(31, 119, 180, 0.1);
}

.neighbor-title {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  line-height: 1.3;
}

.neighbor-meta {
  color: #999;
  font-size: 10px;
}

.more-neighbors {
  padding: 8px;
  text-align: center;
  color: #999;
  font-size: 11px;
  font-style: italic;
}

/* 元数据JSON展示 */
.metadata-json {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 8px;
  overflow-x: auto;
  font-size: 10px;
}

.metadata-json pre {
  margin: 0;
  font-family: 'Monaco', 'Courier New', monospace;
  color: #333;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

/* 响应式 */
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

  .metrics-cards {
    grid-template-columns: 1fr;
  }

  .paper-title {
    font-size: 13px;
  }

  .metric-value {
    font-size: 16px;
  }
}
</style>
