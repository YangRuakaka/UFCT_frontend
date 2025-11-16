/**
 * Author Collaboration Network Page
 */

<template>
  <div class="collaboration-network-container">
    <!-- Left: Filter Panel -->
    <FilterPanel 
      :is-loading="isLoading"
      :university="filters.university"
      :discipline="filters.discipline"
      :year-min="filters.year_min"
      :year-max="filters.year_max"
      :limit-value="filters.limit"
      :min-collaborations-value="filters.min_collaborations"
      :show-min-citations="false"
      :show-min-collaborations="true"
      @filter-apply="handleFilterApply"
      @filter-reset="handleFilterReset"
    />

    <!-- Middle: Legend Panel -->
    <Legend
      colorScheme="degree"
      colorDescription="Node color represents author collaboration frequency"
      networkType="collaboration"
    />

    <!-- Right: Network Graph -->
    <NetworkGraph
      title="Author Collaboration Network"
      :nodes="collaborationNodes"
      :links="collaborationLinks"
      :api-stats="collaborationStats"
      colorScheme="degree"
      colorDescription="Node color represents author collaboration frequency"
      infoTitle="Author Information"
      networkType="collaboration"
      :enableOptimization="true"
      :optimizationThreshold="2"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import NetworkGraph from '../components/NetworkGraph/NetworkGraph.vue';
import FilterPanel from '../components/Shared/FilterPanel.vue';
import Legend from '../components/Shared/Legend.vue';
import { fetchAuthorCollaborationNetwork } from '../services/api';
import { processApiCollaborationResponse, validateNetworkData } from '../utils/apiDataMapper';

export default {
  name: 'AuthorCollaborationNetworkPage',
  components: {
    NetworkGraph,
    FilterPanel,
    Legend
  },
  setup() {
    const collaborationNodes = ref([]);
    const collaborationLinks = ref([]);
    const collaborationStats = ref(null);
    const isLoading = ref(false);
    
    const filters = ref({
      university: '',
      discipline: '',
      year_min: 2020,
      year_max: 2024,
      limit: 500,
      min_collaborations: 1
    });

    const CACHE_KEY = 'collaboration_network_cache';
    const CACHE_PARAMS_KEY = 'collaboration_network_params';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Generate cache parameter hash for comparing parameters
     */
    const getParamsHash = (params) => {
      return JSON.stringify({
        university: params.university || '',
        discipline: params.discipline || '',
        year_min: params.year_min,
        year_max: params.year_max,
        limit: params.limit,
        min_collaborations: params.min_collaborations || 1
      });
    };

    /**
     * Read cached data from localStorage
     */
    const getCachedData = (paramsHash) => {
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        const cachedParams = localStorage.getItem(CACHE_PARAMS_KEY);
        const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);

        if (cached && cachedParams === paramsHash && cachedTime) {
          const cacheAge = Date.now() - parseInt(cachedTime);
          if (cacheAge < CACHE_DURATION) {
            console.log('✓ Using local cached data');
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
     * Save data to localStorage
     */
    const setCachedData = (data, paramsHash) => {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
        localStorage.setItem(CACHE_PARAMS_KEY, paramsHash);
        localStorage.setItem(`${CACHE_KEY}_time`, Date.now().toString());
        console.log('✓ Data cached to local storage');
      } catch (error) {
        console.error('Failed to save cache:', error);
      }
    };

    /**
     * Load data from cache only, no backend request
     */
    const loadFromCacheOnly = () => {
      const paramsHash = getParamsHash(filters.value);
      const cachedData = getCachedData(paramsHash);
      
      if (cachedData) {
        collaborationNodes.value = cachedData.nodes || [];
        collaborationLinks.value = cachedData.links || [];
        console.log('✓ Data loaded from local cache');
      } else {
        console.log('⚠ Local cache not found, waiting for user trigger');
        collaborationNodes.value = [];
        collaborationLinks.value = [];
      }
    };

    /**
     * Load network data: check cache first, request backend if cache miss
     */
    const loadCollaborationNetwork = async (params = {}, fromCache = false) => {
      isLoading.value = true;
      try {
        const queryParams = {
          year_min: params.year_min || filters.value.year_min,
          year_max: params.year_max || filters.value.year_max,
          limit: params.limit || filters.value.limit,
          ...params
        };

        const paramsHash = getParamsHash(queryParams);

        // Try to read from cache first
        const cachedData = getCachedData(paramsHash);
        if (cachedData) {
          collaborationNodes.value = cachedData.nodes || [];
          collaborationLinks.value = cachedData.links || [];
          isLoading.value = false;
          return;
        }

        // If cache-only mode and cache miss, don't make request
        if (fromCache) {
          console.log('⚠ Cache not found, backend request cancelled');
          isLoading.value = false;
          return;
        }

        // Cache miss or parameters changed, make new request
        console.log('🔄 Fetching new data from server...');
        const result = await fetchAuthorCollaborationNetwork(queryParams);

        if (result.success && result.data) {
          // Use data mapper to process API response
          // result.data contains complete response structure: { nodes, edges, metadata, summary, query_params, cached }
          const { nodes, links, stats, communities } = processApiCollaborationResponse(result.data);
          
          // 🔍 调试日志：记录API原始数据
          console.log('📡 API 原始响应数据:', result.data);
          console.log('🔄 处理后的协作网络数据:', {
            nodeCount: nodes.length,
            linkCount: links.length,
            firstNode: nodes[0],
            allNodeKeys: nodes.length > 0 ? Object.keys(nodes[0]) : [],
            sampleNodes: nodes.slice(0, 3)
          });
          
          // Validate data integrity
          const validation = validateNetworkData(nodes, links);
          if (!validation.isValid) {
            console.warn('Data validation issues:', validation.issues);
          }

          collaborationNodes.value = nodes;
          collaborationLinks.value = links;
          collaborationStats.value = stats;

          console.log(`✓ Successfully loaded network data: ${nodes.length} authors, ${links.length} collaboration relationships`);
          console.log('Network statistics:', stats);
          console.log('Communities detected:', communities.length);

          // Cache new data
          const dataToCache = {
            nodes: collaborationNodes.value,
            links: collaborationLinks.value
          };
          setCachedData(dataToCache, paramsHash);
        } else {
          console.error('Failed to load author collaboration network:', result.error);
          // Clear data on request failure
          collaborationNodes.value = [];
          collaborationLinks.value = [];
        }
      } catch (error) {
        console.error('Exception loading network data:', error);
        // Clear data on exception
        collaborationNodes.value = [];
        collaborationLinks.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    const handleFilterApply = (filterParams) => {
      filters.value = { ...filters.value, ...filterParams };
      loadCollaborationNetwork(filterParams, false); // false: allow backend request
    };

    const handleFilterReset = () => {
      filters.value = {
        university: '',
        discipline: '',
        year_min: 2020,
        year_max: 2024,
        limit: 500,
        min_collaborations: 1
      };
      loadCollaborationNetwork(filters.value, false); // false: allow backend request
    };

    onMounted(() => {
      // Only load from cache on page load, no backend request
      loadFromCacheOnly();
    });

    return {
      collaborationNodes,
      collaborationLinks,
      collaborationStats,
      isLoading,
      filters,
      handleFilterApply,
      handleFilterReset
    };
  }
};
</script>

<style scoped>
.collaboration-network-container {
  display: flex;
  flex-direction: row;
  height: 100%;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
}

/* Left: Filter Panel */
.collaboration-network-container > :first-child {
  flex-shrink: 0;
  width: 280px;
}

/* Middle: Legend Panel */
.collaboration-network-container > :nth-child(2) {
  flex-shrink: 0;
  width: 250px;
}

/* Right: Network Graph Main Area */
.collaboration-network-container > :nth-child(3) {
  flex: 1;
  min-width: 0;
}

/* Responsive Design */
@media (max-width: 1440px) {
  .filter-sidebar {
    width: 240px;
  }

  .legend-sidebar {
    width: 220px;
  }
}

@media (max-width: 1024px) {
  .collaboration-network-container {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .filter-sidebar,
  .legend-sidebar {
    width: 100%;
    max-height: 200px;
    flex-shrink: 0;
  }

  .graph-main {
    flex: 1;
    min-height: 400px;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
}

/* 响应式设计 */
@media (max-width: 1440px) {
  .collaboration-network-container > :first-child {
    width: 240px;
  }

  .collaboration-network-container > :nth-child(2) {
    width: 220px;
  }
}

@media (max-width: 1024px) {
  .collaboration-network-container {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .collaboration-network-container > :first-child,
  .collaboration-network-container > :nth-child(2) {
    width: 100%;
    max-height: 200px;
    flex-shrink: 0;
  }

  .collaboration-network-container > :nth-child(3) {
    flex: 1;
    min-height: 400px;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
}

@media (max-width: 768px) {
  .collaboration-network-container {
    gap: 8px;
    padding: 8px;
  }

  .collaboration-network-container > :first-child,
  .collaboration-network-container > :nth-child(2) {
    max-height: 150px;
  }

  .modal-header {
    padding: 16px;
  }

  .modal-header h3 {
    font-size: 16px;
  }

  .modal-body {
    padding: 16px;
  }
}
</style>
