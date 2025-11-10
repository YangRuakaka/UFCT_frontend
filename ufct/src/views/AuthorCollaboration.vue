/**
 * 作者协作网络页面
 */

<template>
  <div class="collaboration-network-page">
    <NetworkGraph
      title="作者协作网络"
      :nodes="collaborationNodes"
      :links="collaborationLinks"
      colorScheme="degree"
      colorDescription="节点颜色代表作者的协作频率"
      infoTitle="作者信息"
      :enableOptimization="true"
      :optimizationThreshold="2"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import NetworkGraph from '../components/NetworkGraph/NetworkGraph.vue';
import { fetchAuthorCollaborationNetwork } from '../services/api';

export default {
  name: 'AuthorCollaborationNetworkPage',
  components: {
    NetworkGraph
  },
  setup() {
    const collaborationNodes = ref([]);
    const collaborationLinks = ref([]);

    const loadCollaborationNetwork = async () => {
      const result = await fetchAuthorCollaborationNetwork({
        university: 'default',
        years: 5,
        limit: 1000
      });

      if (result.success && result.data) {
        collaborationNodes.value = result.data.nodes || [];
        collaborationLinks.value = result.data.links || [];
      } else {
        console.error('加载作者协作网络失败:', result.error);
        // 使用示例数据
        generateMockData();
      }
    };

    const generateMockData = () => {
      // 生成小规模示例数据用于演示（仅 6 个节点）
      const nodes = [
        {
          id: 'author_0',
          label: 'Yann LeCun',
          papers: 45,
          hindex: 150
        },
        {
          id: 'author_1',
          label: 'Geoffrey Hinton',
          papers: 38,
          hindex: 140
        },
        {
          id: 'author_2',
          label: 'Bengio Yoshua',
          papers: 42,
          hindex: 145
        },
        {
          id: 'author_3',
          label: 'Andrew Ng',
          papers: 35,
          hindex: 120
        },
        {
          id: 'author_4',
          label: 'Fei-Fei Li',
          papers: 28,
          hindex: 95
        },
        {
          id: 'author_5',
          label: 'Jürgen Schmidhuber',
          papers: 32,
          hindex: 105
        }
      ];

      const links = [
        { source: 'author_0', target: 'author_1', collaborations: 5 },
        { source: 'author_0', target: 'author_2', collaborations: 8 },
        { source: 'author_1', target: 'author_2', collaborations: 6 },
        { source: 'author_0', target: 'author_3', collaborations: 3 },
        { source: 'author_2', target: 'author_3', collaborations: 4 },
        { source: 'author_3', target: 'author_4', collaborations: 2 },
        { source: 'author_1', target: 'author_5', collaborations: 3 },
        { source: 'author_4', target: 'author_5', collaborations: 2 }
      ];

      collaborationNodes.value = nodes;
      collaborationLinks.value = links;
    };

    onMounted(() => {
      loadCollaborationNetwork();
    });

    return {
      collaborationNodes,
      collaborationLinks
    };
  }
};
</script>

<style scoped>
.collaboration-network-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
