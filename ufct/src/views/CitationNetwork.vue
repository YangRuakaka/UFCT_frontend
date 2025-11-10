/**
 * 论文引用网络页面
 */

<template>
  <div class="citation-network-page">
    <NetworkGraph
      title="论文引用网络"
      :nodes="citationNodes"
      :links="citationLinks"
      colorScheme="degree"
      colorDescription="节点颜色代表论文的被引用频率"
      infoTitle="论文信息"
      :enableOptimization="true"
      :optimizationThreshold="2"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import NetworkGraph from '../components/NetworkGraph/NetworkGraph.vue';
import { fetchCitationNetwork } from '../services/api';

export default {
  name: 'CitationNetworkPage',
  components: {
    NetworkGraph
  },
  setup() {
    const citationNodes = ref([]);
    const citationLinks = ref([]);

    const loadCitationNetwork = async () => {
      const result = await fetchCitationNetwork({
        university: 'default',
        years: 5,
        limit: 1000
      });

      if (result.success && result.data) {
        citationNodes.value = result.data.nodes || [];
        citationLinks.value = result.data.links || [];
      } else {
        console.error('加载论文引用网络失败:', result.error);
        // 使用示例数据
        generateMockData();
      }
    };

    const generateMockData = () => {
      // 生成小规模示例数据用于演示（仅 6 个节点）
      const nodes = [
        {
          id: 'paper_0',
          label: 'Deep Learning Foundations',
          year: 2018,
          citations: 250
        },
        {
          id: 'paper_1',
          label: 'Transformer Architecture',
          year: 2019,
          citations: 180
        },
        {
          id: 'paper_2',
          label: 'Attention Mechanisms',
          year: 2017,
          citations: 320
        },
        {
          id: 'paper_3',
          label: 'Neural Networks',
          year: 2016,
          citations: 420
        },
        {
          id: 'paper_4',
          label: 'Graph Neural Networks',
          year: 2019,
          citations: 150
        },
        {
          id: 'paper_5',
          label: 'BERT Model',
          year: 2018,
          citations: 290
        }
      ];

      const links = [
        { source: 'paper_0', target: 'paper_1', weight: 1 },
        { source: 'paper_0', target: 'paper_2', weight: 1 },
        { source: 'paper_1', target: 'paper_2', weight: 1 },
        { source: 'paper_2', target: 'paper_3', weight: 1 },
        { source: 'paper_3', target: 'paper_4', weight: 1 },
        { source: 'paper_4', target: 'paper_5', weight: 1 },
        { source: 'paper_5', target: 'paper_0', weight: 1 },
        { source: 'paper_1', target: 'paper_5', weight: 1 }
      ];

      citationNodes.value = nodes;
      citationLinks.value = links;
    };

    onMounted(() => {
      loadCitationNetwork();
    });

    return {
      citationNodes,
      citationLinks
    };
  }
};
</script>

<style scoped>
.citation-network-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
