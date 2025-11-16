/**
 * Statistics Filter Panel - 论文统计专用筛选器
 * 仅支持年份和学校筛选，学科默认为 CS 相关主题
 */

<template>
  <div class="statistics-filter-panel">
    <div class="filter-header">
      <h3>🔍 Filters</h3>
      <button class="btn-reset" @click="resetFilters" title="Reset filters">🔄</button>
    </div>

    <!-- 筛选内容 -->
    <div class="filter-content">
      <!-- 年份范围选择 -->
      <div class="filter-group">
        <label class="filter-label">📅 Year Range</label>
        <div class="year-range">
          <div class="year-input-group">
            <input 
              :value="yearMinLocal" 
              type="number" 
              min="1800" 
              max="2024"
              class="year-input"
              @input="updateYearMin"
              @change="onFilterChange"
              placeholder="Start year"
            />
            <span class="year-separator">-</span>
            <input 
              :value="yearMaxLocal" 
              type="number" 
              min="1800" 
              max="2024"
              class="year-input"
              @input="updateYearMax"
              @change="onFilterChange"
              placeholder="End year"
            />
          </div>
        </div>
      </div>

      <!-- 学校选择 -->
      <div class="filter-group">
        <label class="filter-label">🏫 University</label>
        <input 
          v-model="selectedUniversity" 
          type="text"
          class="filter-input"
          placeholder="Enter university name or ID"
          @change="onFilterChange"
        />
        <small class="filter-hint">Optional: leave blank to include all universities</small>
      </div>

      <!-- CS 相关学科信息 -->
      <div class="filter-group">
        <label class="filter-label">🔬 Included CS Topics</label>
        <div class="cs-topics-info">
          <p class="topics-description">
            This analysis includes papers from the following Computer Science related topics:
          </p>
          <div class="topics-list">
            <span class="topic-badge" v-for="topic in csTopics" :key="topic">
              {{ topic }}
            </span>
          </div>
        </div>
      </div>

      <!-- 应用和重置按钮 -->
      <div class="filter-actions">
        <button class="btn-apply" @click="applyFilters" :disabled="isLoading">
          <span v-if="!isLoading">✓ Apply Filters</span>
          <span v-else>⏳ Loading...</span>
        </button>
        <button class="btn-reset-full" @click="resetFilters" :disabled="isLoading">
          ↻ Reset
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'StatisticsFilterPanel',
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    university: {
      type: String,
      default: ''
    },
    yearMin: {
      type: Number,
      default: 2015
    },
    yearMax: {
      type: Number,
      default: 2024
    }
  },
  emits: ['filter-apply', 'filter-reset'],
  setup(props, { emit }) {
    // CS 相关的默认主题列表
    const csTopics = [
      'Computer Science',
      'Machine Learning',
      'Deep Learning',
      'Artificial Intelligence',
      'Natural Language Processing',
      'Computer Vision',
      'Data Science',
      'Software Engineering',
      'Cybersecurity',
      'Distributed Systems',
      'Algorithms',
      'Database Systems',
      'Human-Computer Interaction'
    ];

    // 本地状态
    const yearMinLocal = ref(props.yearMin);
    const yearMaxLocal = ref(props.yearMax);
    const selectedUniversity = ref(props.university);

    /**
     * 更新最小年份
     */
    const updateYearMin = (event) => {
      const value = parseInt(event.target.value);
      if (!isNaN(value)) {
        yearMinLocal.value = value;
      }
    };

    /**
     * 更新最大年份
     */
    const updateYearMax = (event) => {
      const value = parseInt(event.target.value);
      if (!isNaN(value)) {
        yearMaxLocal.value = value;
      }
    };

    /**
     * 触发筛选器变化事件
     */
    const onFilterChange = () => {
      // 验证年份范围
      if (yearMinLocal.value > yearMaxLocal.value) {
        const temp = yearMinLocal.value;
        yearMinLocal.value = yearMaxLocal.value;
        yearMaxLocal.value = temp;
      }
    };

    /**
     * 应用筛选器
     */
    const applyFilters = () => {
      onFilterChange();
      
      const filtersToApply = {
        university: selectedUniversity.value.trim(),
        year_min: yearMinLocal.value,
        year_max: yearMaxLocal.value,
        cs_topics: csTopics
      };

      console.log('📋 Applying filters:', filtersToApply);
      emit('filter-apply', filtersToApply);
    };

    /**
     * 重置筛选器
     */
    const resetFilters = () => {
      yearMinLocal.value = 2015;
      yearMaxLocal.value = 2024;
      selectedUniversity.value = '';

      console.log('🔄 Resetting filters');
      emit('filter-reset');
    };

    /**
     * 监听 props 变化
     */
    watch(() => props.yearMin, (newVal) => {
      yearMinLocal.value = newVal;
    });

    watch(() => props.yearMax, (newVal) => {
      yearMaxLocal.value = newVal;
    });

    watch(() => props.university, (newVal) => {
      selectedUniversity.value = newVal;
    });

    return {
      yearMinLocal,
      yearMaxLocal,
      selectedUniversity,
      csTopics,
      updateYearMin,
      updateYearMax,
      onFilterChange,
      applyFilters,
      resetFilters
    };
  }
};
</script>

<style scoped>
.statistics-filter-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 2px solid #f0f0f0;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #2c3e50;
}

.btn-reset {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 4px;
  transition: background 0.2s;
}

.btn-reset:hover {
  background: #f0f0f0;
}

.filter-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.95rem;
}

.year-range {
  display: flex;
  flex-direction: column;
}

.year-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.year-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.year-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.year-separator {
  color: #999;
  font-weight: bold;
}

.filter-input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s;
}

.filter-input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.filter-hint {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
}

.cs-topics-info {
  background: #f0f8ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  padding: 12px;
}

.topics-description {
  margin: 0 0 10px 0;
  font-size: 0.85rem;
  color: #2c3e50;
  line-height: 1.4;
}

.topics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.topic-badge {
  display: inline-block;
  background: #3498db;
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.filter-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  flex-shrink: 0;
}

.btn-apply,
.btn-reset-full {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-apply {
  background: #27ae60;
  color: white;
}

.btn-apply:hover:not(:disabled) {
  background: #229954;
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
}

.btn-apply:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.7;
}

.btn-reset-full {
  background: #e8f4f8;
  color: #2c3e50;
  border: 1px solid #b3d9e8;
}

.btn-reset-full:hover:not(:disabled) {
  background: #d5e8f7;
  border-color: #7fc4de;
}

.btn-reset-full:disabled {
  background: #f5f5f5;
  color: #999;
  border-color: #ddd;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 滚动条样式 */
.filter-content::-webkit-scrollbar {
  width: 6px;
}

.filter-content::-webkit-scrollbar-track {
  background: transparent;
}

.filter-content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
