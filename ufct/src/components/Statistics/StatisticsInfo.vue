/**
 * Statistics Information Panel Component
 * Displays metadata and statistics about the CS papers dataset
 */

<template>
  <div class="statistics-info-container">
    <h2 class="info-title">📊 Dataset Statistics</h2>
    
    <div class="info-grid">
      <!-- Column 1: Overview -->
      <div class="info-column">
        <h3 class="column-title">Overview</h3>
        <div class="info-row">
          <span class="label">Total Papers:</span>
          <span class="value">{{ formatNumber(metadata?.total_papers) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Total Citations:</span>
          <span class="value">{{ formatNumber(metadata?.total_citations) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Date Range:</span>
          <span class="value">
            {{ metadata?.year_range?.min || 'N/A' }} - {{ metadata?.year_range?.max || 'N/A' }}
          </span>
        </div>
      </div>

      <!-- Column 2: Citation Statistics -->
      <div class="info-column">
        <h3 class="column-title">Statistics</h3>
        <div class="info-row">
          <span class="label">Avg Per Paper:</span>
          <span class="value">{{ (metadata?.avg_citation_count_per_paper ?? 0).toFixed(2) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Max Value:</span>
          <span class="value">{{ formatNumber(metadata?.max_citation_count) }}</span>
        </div>
        <div class="info-row">
          <span class="label">Min Value:</span>
          <span class="value">{{ formatNumber(metadata?.min_citation_count) }}</span>
        </div>
      </div>

      <!-- Column 3: Distribution -->
      <div class="info-column">
        <h3 class="column-title">Distribution</h3>
        <div class="info-row">
          <span class="label">Standard Deviation:</span>
          <span class="value">{{ (metadata?.citation_count_std_dev ?? 0).toFixed(2) }}</span>
        </div>
        <div class="info-row" v-if="selectedYear">
          <span class="label">Selected Year:</span>
          <span class="value highlight">{{ selectedYear }}</span>
        </div>
        <div class="info-row" v-else>
          <span class="label">View Mode:</span>
          <span class="value">All Years</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'StatisticsInfo',
  props: {
    metadata: {
      type: Object,
      default: null
    },
    selectedYear: {
      type: Number,
      default: null
    }
  },
  methods: {
    /**
     * 格式化数字显示
     * @param {*} value - 要格式化的值
     * @returns {string} 格式化后的字符串
     */
    formatNumber(value) {
      // 处理 null, undefined, NaN 的情况
      if (value === null || value === undefined || isNaN(value)) {
        return '0';
      }
      
      // 如果是浮点数，保留2位小数；如果是整数，直接显示
      if (typeof value === 'number') {
        if (value === Math.floor(value)) {
          return value.toLocaleString();
        } else {
          return value.toFixed(2);
        }
      }
      
      return String(value);
    }
  }
};
</script>

<style scoped>
.statistics-info-container {
  padding: 20px;
}

.info-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin-bottom: 20px;
}

.info-column {
  padding: 15px;
  border-left: 4px solid #3498db;
  background: #f8f9fa;
  border-radius: 6px;
}

.column-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e0e0e0;
  font-size: 0.9rem;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #2c3e50;
  font-weight: 700;
  text-align: right;
  min-width: 100px;
}

.value.highlight {
  color: #27ae60;
  background: #d5f4e6;
  padding: 2px 8px;
  border-radius: 4px;
  display: inline-block;
}

.info-footer {
  background: #e8f4f8;
  border: 1px solid #b3d9e8;
  border-radius: 6px;
  padding: 12px 15px;
}

.footer-note {
  margin: 0;
  font-size: 0.85rem;
  color: #2c3e50;
  line-height: 1.5;
}

@media (max-width: 1200px) {
  .info-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
