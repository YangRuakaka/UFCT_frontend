/**
 * Paper Citation Network Page
 */

<template>
  <div class="citation-network-container">
    <!-- Left: Filter Panel -->
    <FilterPanel 
      :is-loading="isLoading"
      :university="filters.university"
      :discipline="filters.discipline"
      :year-min="filters.year_min"
      :year-max="filters.year_max"
      :limit-value="filters.limit"
      :min-citations-value="filters.min_citations"
      :show-min-citations="true"
      :show-min-collaborations="false"
      @filter-apply="handleFilterApply"
      @filter-reset="handleFilterReset"
    />

    <!-- Middle: Legend Panel -->
    <Legend
      colorScheme="degree"
      colorDescription="Node color represents the citation frequency of papers"
      networkType="citation"
    />

    <!-- Right: Network Graph -->
    <NetworkGraph
      title="Paper Citation Network"
      :nodes="citationNodes"
      :links="citationLinks"
      :api-stats="citationStats"
      colorScheme="degree"
      colorDescription="Node color represents the citation frequency of papers"
      infoTitle="Paper Information"
      networkType="citation"
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
import { fetchCitationNetwork } from '../services/api';
import { processApiCitationResponse, validateNetworkData } from '../utils/apiDataMapper';

export default {
  name: 'CitationNetworkPage',
  components: {
    NetworkGraph,
    FilterPanel,
    Legend
  },
  setup() {
    const citationNodes = ref([]);
    const citationLinks = ref([]);
    const citationStats = ref(null);
    const isLoading = ref(false);
    
    const filters = ref({
      university: '',
      discipline: '',
      year_min: 2020,
      year_max: 2024,
      limit: 500,
      min_citations: 0
    });

    const CACHE_KEY = 'citation_network_cache';
    const CACHE_PARAMS_KEY = 'citation_network_params';
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
        min_citations: params.min_citations || 0
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
        citationNodes.value = cachedData.nodes || [];
        citationLinks.value = cachedData.links || [];
        console.log('✓ Data loaded from local cache');
      } else {
        console.log('⚠ Local cache not found, waiting for user trigger');
        citationNodes.value = [];
        citationLinks.value = [];
      }
    };

    /**
     * Load network data: check cache first, request backend if cache miss
     */
    const loadCitationNetwork = async (params = {}, fromCache = false) => {
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
          citationNodes.value = cachedData.nodes || [];
          citationLinks.value = cachedData.links || [];
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
        const result = await fetchCitationNetwork(queryParams);

        if (result.success && result.data) {
          // Use data mapper to process API response
          // result.data contains complete response structure: { nodes, edges, metadata, summary, query_params, cached }
          const { nodes, links, stats } = processApiCitationResponse(result.data);
          
          // Validate data integrity
          const validation = validateNetworkData(nodes, links);
          if (!validation.isValid) {
            console.warn('Data validation issues:', validation.issues);
          }

          citationNodes.value = nodes;
          citationLinks.value = links;
          citationStats.value = stats;

          console.log(`✓ Successfully loaded network data: ${nodes.length} nodes, ${links.length} edges`);
          console.log('Network statistics:', stats);

          // Cache new data
          const dataToCache = {
            nodes: citationNodes.value,
            links: citationLinks.value
          };
          setCachedData(dataToCache, paramsHash);
        } else {
          console.error('Failed to load citation network:', result.error);
          // Clear data on request failure
          citationNodes.value = [];
          citationLinks.value = [];
        }
      } catch (error) {
        console.error('Exception loading network data:', error);
        // Clear data on exception
        citationNodes.value = [];
        citationLinks.value = [];
      } finally {
        isLoading.value = false;
      }
    };

    const handleFilterApply = (filterParams) => {
      filters.value = { ...filters.value, ...filterParams };
      loadCitationNetwork(filterParams, false); // false: allow backend request
    };

    const handleFilterReset = () => {
      filters.value = {
        university: '',
        discipline: '',
        year_min: 2020,
        year_max: 2024,
        limit: 500,
        min_citations: 0
      };
      loadCitationNetwork(filters.value, false); // false: allow backend request
    };

    onMounted(() => {
      // Only load from cache on page load, no backend request
      loadFromCacheOnly();
    });

    return {
      citationNodes,
      citationLinks,
      citationStats,
      isLoading,
      filters,
      handleFilterApply,
      handleFilterReset
    };
  }
};
</script>

<style scoped>
.citation-network-container {
  display: flex;
  flex-direction: row;
  height: 100%;
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
}

/* Left: Filter Panel */
.citation-network-container > :first-child {
  flex-shrink: 0;
  width: 280px;
}

/* Middle: Legend Panel */
.citation-network-container > :nth-child(2) {
  flex-shrink: 0;
  width: 250px;
}

/* Right: Network Graph Main Area */
.citation-network-container > :nth-child(3) {
  flex: 1;
  min-width: 0;
}

/* Responsive Design */
@media (max-width: 1440px) {
  .citation-network-container > :first-child {
    width: 240px;
  }

  .citation-network-container > :nth-child(2) {
    width: 220px;
  }
}

@media (max-width: 1024px) {
  .citation-network-container {
    flex-direction: column;
    gap: 10px;
    padding: 10px;
  }

  .citation-network-container > :first-child,
  .citation-network-container > :nth-child(2) {
    width: 100%;
    max-height: 200px;
    flex-shrink: 0;
  }

  .citation-network-container > :nth-child(3) {
    flex: 1;
    min-height: 400px;
  }

  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
}

@media (max-width: 768px) {
  .citation-network-container {
    gap: 8px;
    padding: 8px;
  }

  .citation-network-container > :first-child,
  .citation-network-container > :nth-child(2) {
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
