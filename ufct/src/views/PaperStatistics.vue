/**
 * Paper Statistics Dashboard - T2 Requirement
 * 展示：(1) 时间线图表 - 过去10年CS相关论文数量
 *       (2) 直方图 - 论文的引用数量分布
 * 交互：点击时间线上的数据点，直方图更新显示该年份论文的引用分布
 */

<template>
  <div class="paper-statistics-container">
    <!-- 头部：标题和说明 -->
    <div class="statistics-header">
      <h1 class="page-title">📈 Paper Statistics Dashboard</h1>
      <p class="page-description">
        Analyze CS-related paper publication trends and patent citation distribution over the past 10 years
      </p>
    </div>

    <!-- 控制面板：筛选器 -->
    <div class="control-panel">
      <StatisticsFilterPanel 
        :is-loading="isLoading"
        :university="filters.university"
        :year-min="filters.year_min"
        :year-max="filters.year_max"
        @filter-apply="handleFilterApply"
        @filter-reset="handleFilterReset"
      />
    </div>

    <!-- 主内容区域 -->
    <div class="statistics-content">
      <!-- 左侧：时间线图表 -->
      <div class="chart-container timeline-wrapper">
        <div class="chart-header">
          <h2 class="chart-title">📊 Paper Publication Timeline</h2>
          <p class="chart-subtitle">Number of CS papers published per year</p>
        </div>
        <div v-if="isLoading" class="loading-spinner">
          <span>Loading data...</span>
        </div>
        <div v-else-if="timelineChartError" class="error-message">
          {{ timelineChartError }}
        </div>
        <div v-else class="timeline-chart-wrapper">
          <TimelineChart 
            :data="timelineData"
            :selectedYear="selectedYear"
            @year-selected="handleYearSelected"
          />
        </div>
      </div>

      <!-- 右侧：直方图 -->
      <div class="chart-container histogram-wrapper">
        <div class="chart-header">
          <h2 class="chart-title">📊 Citation Count Distribution</h2>
          <p class="chart-subtitle" v-if="selectedYear">
            Papers from <strong>{{ selectedYear }}</strong> 
            (Total: {{ selectedYearPaperCount }} papers)
          </p>
          <p class="chart-subtitle" v-else>
            All papers combined (Total: {{ totalPaperCount }} papers)
          </p>
        </div>
        <div v-if="isLoading" class="loading-spinner">
          <span>Loading data...</span>
        </div>
        <div v-else-if="histogramError" class="error-message">
          {{ histogramError }}
        </div>
        <div v-else class="histogram-wrapper">
          <CitationHistogram 
            :data="histogramData"
            :selectedYear="selectedYear"
            :title="selectedYear ? `${selectedYear}` : 'All Years'"
          />
        </div>
      </div>
    </div>

    <!-- 底部：统计信息面板 -->
    <div class="statistics-info-panel">
      <StatisticsInfo 
        :metadata="statisticsMetadata"
        :selectedYear="selectedYear"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import StatisticsFilterPanel from '../components/Statistics/StatisticsFilterPanel.vue';
import TimelineChart from '../components/Statistics/TimelineChart.vue';
import CitationHistogram from '../components/Statistics/CitationHistogram.vue';
import StatisticsInfo from '../components/Statistics/StatisticsInfo.vue';
import { fetchPaperStatistics } from '../services/api';
import { processPaperStatisticsResponse } from '../utils/apiDataMapper';

export default {
  name: 'PaperStatistics',
  components: {
    StatisticsFilterPanel,
    TimelineChart,
    CitationHistogram,
    StatisticsInfo
  },
  setup() {
    const isLoading = ref(false);
    const timelineChartError = ref(null);
    const histogramError = ref(null);
    
    const timelineData = ref([]);
    const allYearsHistogramData = ref([]);
    const histogramByYear = ref({});
    const statisticsMetadata = ref(null);
    
    const selectedYear = ref(null);
    
    const filters = ref({
      university: '',
      year_min: 2015,
      year_max: 2024,
      cs_topics: [
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
      ]
    });

    const CACHE_KEY = 'paper_statistics_cache';
    const CACHE_PARAMS_KEY = 'paper_statistics_params';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * 生成缓存参数哈希值
     */
    const getParamsHash = (params) => {
      return JSON.stringify({
        university: params.university || '',
        year_min: params.year_min,
        year_max: params.year_max
      });
    };

    /**
     * 从本地存储读取缓存数据
     */
    const getCachedData = (paramsHash) => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedParams = localStorage.getItem(CACHE_PARAMS_KEY);
        const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);

        if (cached && cachedParams === paramsHash && cachedTime) {
          const cacheAge = Date.now() - parseInt(cachedTime);
          if (cacheAge < CACHE_DURATION) {
            console.log('✓ Using local cached statistics data');
            return JSON.parse(cached);
          } else {
            console.log('⚠ Cache expired (24 hours)');
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem(CACHE_PARAMS_KEY);
            localStorage.removeItem(`${CACHE_KEY}_time`);
            return null;
          }
        }
        return null;
      } catch (error) {
        console.error('Failed to read cache:', error);
        return null;
      }
    };

    /**
     * 保存数据到本地存储
     */
    const setCachedData = (data, paramsHash) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_PARAMS_KEY, paramsHash);
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
        console.log('✓ Statistics data cached to local storage');
      } catch (error) {
        console.error('Failed to save cache:', error);
      }
    };

    /**
     * 从后端获取统计数据
     */
    const loadStatisticsFromAPI = async () => {
      isLoading.value = true;
      timelineChartError.value = null;
      histogramError.value = null;
      selectedYear.value = null;

      try {
        console.log('📡 Fetching statistics with params:', filters.value);
        
        const result = await fetchPaperStatistics(filters.value);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch statistics');
        }

        const processedData = processPaperStatisticsResponse(result.data);
        
        timelineData.value = processedData.timeline || [];
        allYearsHistogramData.value = processedData.globalHistogram || [];
        histogramByYear.value = processedData.histogramByYear || {};
        statisticsMetadata.value = processedData.metadata || null;

        console.log('✓ Statistics loaded successfully:', {
          timelinePoints: timelineData.value.length,
          histogramBins: allYearsHistogramData.value.length,
          yearsWithData: Object.keys(histogramByYear.value).length
        });

        // 缓存数据
        const paramsHash = getParamsHash(filters.value);
        setCachedData({
          timeline: timelineData.value,
          globalHistogram: allYearsHistogramData.value,
          histogramByYear: histogramByYear.value,
          metadata: statisticsMetadata.value
        }, paramsHash);

      } catch (error) {
        console.error('❌ Error loading statistics:', error.message);
        timelineChartError.value = `Failed to load timeline data: ${error.message}`;
        histogramError.value = `Failed to load histogram data: ${error.message}`;
      } finally {
        isLoading.value = false;
      }
    };

    /**
     * 尝试从缓存加载统计数据（仅在初始化时）
     */
    const loadFromCacheOnly = () => {
      const paramsHash = getParamsHash(filters.value);
      const cachedData = getCachedData(paramsHash);
      
      if (cachedData) {
        timelineData.value = cachedData.timeline || [];
        allYearsHistogramData.value = cachedData.globalHistogram || [];
        histogramByYear.value = cachedData.histogramByYear || {};
        statisticsMetadata.value = cachedData.metadata || null;
        console.log('✓ Statistics loaded from local cache');
      } else {
        console.log('⚠ No cache found for statistics');
        timelineData.value = [];
        allYearsHistogramData.value = [];
        histogramByYear.value = {};
      }
    };

    /**
     * 处理年份选择
     */
    const handleYearSelected = (year) => {
      console.log('Year selected:', year);
      selectedYear.value = year;
      
      // 更新直方图数据
      if (year && histogramByYear.value[year]) {
        histogramData.value = histogramByYear.value[year];
      } else if (!year) {
        histogramData.value = allYearsHistogramData.value;
      }
    };

    /**
     * 处理筛选器应用
     */
    const handleFilterApply = (newFilters) => {
      filters.value = {
        university: newFilters.university || '',
        year_min: newFilters.year_min,
        year_max: newFilters.year_max,
        cs_topics: newFilters.cs_topics || filters.value.cs_topics
      };
      
      // 重置选择的年份
      selectedYear.value = null;
      
      // 从 API 重新加载数据
      loadStatisticsFromAPI();
    };

    /**
     * 处理筛选器重置
     */
    const handleFilterReset = () => {
      filters.value = {
        university: '',
        year_min: 2015,
        year_max: 2024,
        cs_topics: [
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
        ]
      };
      selectedYear.value = null;
      loadStatisticsFromAPI();
    };

    /**
     * 计算直方图数据（根据选中的年份）
     */
    const histogramData = computed({
      get() {
        if (selectedYear.value && histogramByYear.value[selectedYear.value]) {
          return histogramByYear.value[selectedYear.value];
        }
        return allYearsHistogramData.value;
      }
    });

    /**
     * 计算选中年份的论文总数
     */
    const selectedYearPaperCount = computed(() => {
      if (!selectedYear.value || !timelineData.value) return 0;
      const yearData = timelineData.value.find(d => d.year === selectedYear.value);
      return yearData ? yearData.paperCount : 0;
    });

    /**
     * 计算全部论文总数
     */
    const totalPaperCount = computed(() => {
      return statisticsMetadata.value?.total_papers || 0;
    });

    /**
     * 页面初始化
     */
    onMounted(() => {
      console.log('📌 PaperStatistics component mounted');
      
      // 首先尝试从缓存加载
      loadFromCacheOnly();
      
      // 然后从 API 获取最新数据（后台加载，不阻塞 UI）
      loadStatisticsFromAPI();
    });

    return {
      isLoading,
      timelineChartError,
      histogramError,
      timelineData,
      histogramData,
      statisticsMetadata,
      selectedYear,
      selectedYearPaperCount,
      totalPaperCount,
      filters,
      handleYearSelected,
      handleFilterApply,
      handleFilterReset
    };
  }
};
</script>

<style scoped>
.paper-statistics-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  overflow-y: auto;
  gap: 20px;
}

.statistics-header {
  text-align: center;
  margin-bottom: 10px;
  padding: 20px 0;
  flex-shrink: 0;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 10px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.page-description {
  font-size: 1rem;
  color: #555;
  margin: 0;
}

.control-panel {
  margin-bottom: 0;
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.statistics-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  height: 500px;
  flex-shrink: 0;
}

@media (max-width: 1400px) {
  .statistics-content {
    grid-template-columns: 1fr;
    height: auto;
  }
  
  .timeline-wrapper {
    height: 500px;
  }
  
  .histogram-wrapper {
    height: 500px;
  }
}

.chart-container {
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e8ed;
  height: 100%;
  overflow: hidden;
}

.timeline-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.histogram-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-header {
  margin-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
  flex-shrink: 0;
}

.chart-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.chart-subtitle {
  font-size: 0.85rem;
  color: #888;
  margin: 5px 0 0 0;
}

.timeline-chart-wrapper,
.histogram-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
  font-size: 1rem;
}

.loading-spinner::before {
  content: '';
  display: inline-block;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #e74c3c;
  font-size: 0.95rem;
  background: #fadbd8;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.statistics-info-panel {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e1e8ed;
  flex-shrink: 0;
}
</style>
