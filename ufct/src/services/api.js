/**
 * API 服务层 - 用于处理与后端的通信
 */

import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 获取论文引用网络数据
 * @param {Object} params - 查询参数 { university, years, limit }
 * @returns {Promise} 包含节点和链接的网络数据
 */
export async function fetchCitationNetwork(params = {}) {
  try {
    const response = await axiosInstance.get('/citation-network', { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.warn('后端不可用，使用本地 Mock 数据');
    return {
      success: true,
      data: getMockCitationNetworkData()
    };
  }
}

/**
 * 获取论文引用网络的 Mock 数据（小规模）
 */
export function getMockCitationNetworkData() {
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

  return { nodes, links };
}

/**
 * 获取作者协作网络数据
 * @param {Object} params - 查询参数 { university, years, limit }
 * @returns {Promise} 包含节点和链接的网络数据
 */
export async function fetchAuthorCollaborationNetwork(params = {}) {
  try {
    const response = await axiosInstance.get('/author-collaboration-network', { params });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.warn('后端不可用，使用本地 Mock 数据');
    return {
      success: true,
      data: getMockAuthorCollaborationData()
    };
  }
}

/**
 * 获取作者协作网络的 Mock 数据（小规模）
 */
export function getMockAuthorCollaborationData() {
  const nodes = [
    {
      id: 'author_0',
      label: 'Yann LeCun',
      papers: 45,
      degree: 8
    },
    {
      id: 'author_1',
      label: 'Geoffrey Hinton',
      papers: 38,
      degree: 7
    },
    {
      id: 'author_2',
      label: 'Bengio Yoshua',
      papers: 42,
      degree: 8
    },
    {
      id: 'author_3',
      label: 'Andrew Ng',
      papers: 35,
      degree: 6
    },
    {
      id: 'author_4',
      label: 'Fei-Fei Li',
      papers: 28,
      degree: 5
    },
    {
      id: 'author_5',
      label: 'Jürgen Schmidhuber',
      papers: 32,
      degree: 5
    }
  ];

  const links = [
    { source: 'author_0', target: 'author_1', weight: 5 },
    { source: 'author_0', target: 'author_2', weight: 8 },
    { source: 'author_1', target: 'author_2', weight: 6 },
    { source: 'author_0', target: 'author_3', weight: 3 },
    { source: 'author_2', target: 'author_3', weight: 4 },
    { source: 'author_3', target: 'author_4', weight: 2 },
    { source: 'author_1', target: 'author_5', weight: 3 },
    { source: 'author_4', target: 'author_5', weight: 2 }
  ];

  return { nodes, links };
}

/**
 * 获取节点详细信息
 * @param {string} nodeId - 节点ID
 * @param {string} networkType - 网络类型 'citation' | 'collaboration'
 * @returns {Promise} 节点详细信息
 */
export async function fetchNodeDetails(nodeId, networkType = 'citation') {
  try {
    const response = await axiosInstance.get(`/${networkType}-network/nodes/${nodeId}`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
}

/**
 * 搜索节点
 * @param {string} query - 搜索查询
 * @param {string} networkType - 网络类型
 * @returns {Promise} 搜索结果
 */
export async function searchNodes(query, networkType = 'citation') {
  try {
    const response = await axiosInstance.get(`/${networkType}-network/search`, {
      params: { query }
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
}

export default {
  fetchCitationNetwork,
  fetchAuthorCollaborationNetwork,
  fetchNodeDetails,
  searchNodes
};
