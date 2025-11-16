/**
 * Filter Panel Component - Used to select universities and disciplines
 */

<template>
  <div class="filter-panel">
    <div class="filter-header">
      <h3>📋 Filters</h3>
      <button class="btn-reset" @click="resetFilters" title="Reset filters">🔄</button>
    </div>

    <!-- Scrollable Content Area -->
    <div class="filter-content">
      <!-- Year Range Selection -->
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
            <span>-</span>
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

      <!-- University Selection -->
      <div class="filter-group">
        <label class="filter-label">🏫 University</label>
        <input 
          v-model="selectedUniversity" 
          type="text"
          class="filter-input"
          placeholder="Enter university name or ID"
          @change="onFilterChange"
        />
      </div>

      <!-- Discipline Selection -->
      <div class="filter-group">
        <label class="filter-label">🔬 Discipline</label>
        <select 
          v-model="selectedDiscipline" 
          class="filter-select"
          @change="onFilterChange"
        >
          <option value="">-- All Disciplines --</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Machine Learning">Machine Learning</option>
          <option value="Artificial Intelligence">Artificial Intelligence</option>
          <option value="Natural Language Processing">Natural Language Processing</option>
          <option value="Deep Learning">Deep Learning</option>
          <option value="T10001">Machine Learning (T10001)</option>
          <option value="T10002">Artificial Intelligence (T10002)</option>
          <option value="Physics">Physics</option>
          <option value="Mathematics">Mathematics</option>
          <option value="Biology">Biology</option>
        </select>
      </div>

      <!-- Data Limit -->
      <div class="filter-group">
        <label class="filter-label">📊 Data Limit</label>
        <div class="limit-control">
          <input 
            v-model.number="limit" 
            type="range" 
            min="50" 
            max="50000"
            step="100"
            class="limit-slider"
            @change="onFilterChange"
          />
          <span class="limit-value">{{ limit }}</span>
        </div>
        <small class="filter-hint">Range: 50 - 50,000 nodes</small>
      </div>

      <!-- Minimum Citations (Only in Citation Network) -->
      <div v-if="showMinCitations" class="filter-group">
        <label class="filter-label">⭐ Minimum Citations</label>
        <div class="min-citations-control">
          <input 
            v-model.number="minCitations" 
            type="range" 
            min="0" 
            max="500"
            step="10"
            class="min-citations-slider"
            @change="onFilterChange"
          />
          <span class="min-citations-value">{{ minCitations }}</span>
        </div>
        <small class="filter-hint">Range: 0 - 500</small>
      </div>

      <!-- Minimum Collaborations (Only in Author Collaboration Network) -->
      <div v-if="showMinCollaborations" class="filter-group">
        <label class="filter-label">🤝 Minimum Collaborations</label>
        <div class="min-collaborations-control">
          <input 
            v-model.number="minCollaborations" 
            type="range" 
            min="1" 
            max="100"
            step="1"
            class="min-collaborations-slider"
            @change="onFilterChange"
          />
          <span class="min-collaborations-value">{{ minCollaborations }}</span>
        </div>
        <small class="filter-hint">Range: 1 - 100</small>
      </div>

      <!-- Current Filter Status -->
      <div v-if="hasActiveFilters" class="filter-status">
        <div class="status-title">Current Filters:</div>
        <div class="status-item" v-if="selectedUniversity">
          🏫 {{ selectedUniversity }}
        </div>
        <div class="status-item" v-if="selectedDiscipline">
          🔬 {{ selectedDiscipline }}
        </div>
        <div class="status-item">
          📅 {{ yearMinLocal }} - {{ yearMaxLocal }}
        </div>
      </div>
    </div>

    <!-- Query Button -->
    <div class="filter-actions">
      <button 
        class="btn btn-apply"
        @click="applyFilters"
        :disabled="isLoading"
      >
        {{ isLoading ? 'Loading...' : '🔍 Search' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'FilterPanel',
  props: {
    isLoading: {
      type: Boolean,
      default: false
    },
    university: {
      type: String,
      default: ''
    },
    discipline: {
      type: String,
      default: ''
    },
    yearMin: {
      type: Number,
      default: 2020
    },
    yearMax: {
      type: Number,
      default: 2024
    },
    limitValue: {
      type: Number,
      default: 500
    },
    minCitationsValue: {
      type: Number,
      default: 0
    },
    minCollaborationsValue: {
      type: Number,
      default: 1
    },
    showMinCitations: {
      type: Boolean,
      default: false
    },
    showMinCollaborations: {
      type: Boolean,
      default: false
    }
  },
  emits: ['filter-change', 'filter-apply', 'filter-reset'],
  setup(props, { emit }) {
    const selectedUniversity = ref(props.university);
    const selectedDiscipline = ref(props.discipline);
    const yearMinLocal = ref(props.yearMin);
    const yearMaxLocal = ref(props.yearMax);
    const limit = ref(props.limitValue);
    const minCitations = ref(props.minCitationsValue);
    const minCollaborations = ref(props.minCollaborationsValue);

    const updateYearMin = (event) => {
      yearMinLocal.value = Number(event.target.value);
    };

    const updateYearMax = (event) => {
      yearMaxLocal.value = Number(event.target.value);
    };

    const hasActiveFilters = computed(() => {
      return selectedUniversity.value || selectedDiscipline.value;
    });

    const onFilterChange = () => {
      // Validate year range
      if (yearMinLocal.value > yearMaxLocal.value) {
        const temp = yearMinLocal.value;
        yearMinLocal.value = yearMaxLocal.value;
        yearMaxLocal.value = temp;
      }
      
      // Emit change event immediately (for preview)
      emit('filter-change', {
        university: selectedUniversity.value,
        discipline: selectedDiscipline.value,
        year_min: yearMinLocal.value,
        year_max: yearMaxLocal.value,
        limit: limit.value,
        min_citations: minCitations.value,
        min_collaborations: minCollaborations.value
      });
    };

    const applyFilters = () => {
      emit('filter-apply', {
        university: selectedUniversity.value,
        discipline: selectedDiscipline.value,
        year_min: yearMinLocal.value,
        year_max: yearMaxLocal.value,
        limit: limit.value,
        min_citations: minCitations.value,
        min_collaborations: minCollaborations.value
      });
    };

    const resetFilters = () => {
      selectedUniversity.value = '';
      selectedDiscipline.value = '';
      yearMinLocal.value = 2020;
      yearMaxLocal.value = 2024;
      limit.value = 500;
      minCitations.value = 0;
      minCollaborations.value = 1;
      
      emit('filter-reset');
    };

    return {
      selectedUniversity,
      selectedDiscipline,
      yearMinLocal,
      yearMaxLocal,
      limit,
      minCitations,
      minCollaborations,
      hasActiveFilters,
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
.filter-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  flex-shrink: 0;
  width: 280px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;
}

.filter-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.btn-reset {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 200ms ease;
}

.btn-reset:hover {
  color: #333;
}

/* 可滚动内容区域 - 隐藏滚动条 */
.filter-content {
  flex: 1;
  overflow-y: scroll;
  overflow-x: hidden;
  padding-right: 8px;
}

/* 隐藏滚动条但保留滚动功能 */
.filter-content::-webkit-scrollbar {
  width: 6px;
}

.filter-content::-webkit-scrollbar-track {
  background: transparent;
}

.filter-content::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}

.filter-content::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

/* Firefox 滚动条隐藏 */
.filter-content {
  scrollbar-width: thin;
  scrollbar-color: transparent transparent;
}

.filter-content:hover {
  scrollbar-color: #ccc transparent;
}

.filter-group {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}

.filter-select,
.year-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  color: #333;
  transition: border-color 200ms ease;
}

.filter-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  color: #333;
  transition: border-color 200ms ease;
}

.filter-select:hover,
.filter-input:hover,
.year-input:hover {
  border-color: #999;
}

.filter-select:focus,
.filter-input:focus,
.year-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.year-range {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.year-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.year-input {
  flex: 1;
}

.year-input-group span {
  font-size: 12px;
  color: #999;
}

.limit-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.limit-slider {
  flex: 1;
  cursor: pointer;
}

.limit-value {
  min-width: 40px;
  font-weight: 600;
  color: #667eea;
  font-size: 12px;
}

.min-citations-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.min-citations-slider {
  flex: 1;
  cursor: pointer;
}

.min-citations-value {
  min-width: 40px;
  font-weight: 600;
  color: #667eea;
  font-size: 12px;
}

.min-collaborations-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.min-collaborations-slider {
  flex: 1;
  cursor: pointer;
}

.min-collaborations-value {
  min-width: 40px;
  font-weight: 600;
  color: #667eea;
  font-size: 12px;
}

.filter-hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: #999;
}

.filter-actions {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  background: white;
  flex-shrink: 0;
}

.btn-apply {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 300ms ease;
}

.btn-apply:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-apply:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.filter-status {
  padding: 12px;
  background: #f0f5ff;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
}

.status-title {
  font-weight: 600;
  color: #667eea;
  margin-bottom: 6px;
}

.status-item {
  padding: 4px 0;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
