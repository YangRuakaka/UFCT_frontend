/**
 * 数据映射工具库 - 智能处理后端传来的基础信息
 * 将简单的节点和边数据转化为可视化所需的完整属性
 */

/**
 * 智能映射节点数据 - 补充缺失的可视化属性
 * @param {Array} nodes - 原始节点数组（仅含基础信息）
 * @param {Array} links - 边数组
 * @param {Object} options - 映射选项
 * @returns {Array} 补充后的节点数组
 */
export function mapNodeData(nodes, links, options = {}) {
  const {
    defaultRadius: minRadius = 4,
    maxRadius = 25,
    colorScheme = 'degree', // degree | centrality | community
    defaultColor = '#1f77b4'
  } = options;

  // 预计算度数（仅一次）
  const degrees = calculateDegrees(nodes, links);
  const maxDegree = Math.max(...Object.values(degrees), 1);
  const minDegree = Math.min(...Object.values(degrees), 0);

  // 预计算中心性（如需要）
  const centrality = colorScheme === 'centrality' ? calculateBetweennessCentrality(nodes, links) : null;

  return nodes.map(node => ({
    ...node,
    // 度数信息
    degree: degrees[node.id] || 0,
    // 动态计算的大小
    size: calculateNodeSize(degrees[node.id] || 0, minRadius, maxRadius, minDegree, maxDegree),
    // 颜色映射
    color: mapNodeColor(node, degrees[node.id] || 0, maxDegree, centrality, colorScheme, defaultColor),
    // 优先级（用于优化和交互排序）
    priority: calculateNodePriority(node, degrees[node.id] || 0, maxDegree),
    // 节点类型识别
    nodeType: identifyNodeType(node)
  }));
}

/**
 * 智能映射边数据 - 补充缺失的可视化属性
 * @param {Array} edges - 原始边数组
 * @param {Object} nodeMap - 节点ID->节点对象的映射
 * @param {Object} options - 映射选项
 * @returns {Array} 补充后的边数组
 */
export function mapEdgeData(edges, nodeMap, options = {}) {
  const {
    defaultWidth: minWidth = 0.5,
    maxWidth = 3,
    weightField = 'weight'
  } = options;

  // 预计算权重统计
  const weights = edges.map(e => e[weightField] || 1);
  const maxWeight = Math.max(...weights, 1);
  const minWeight = Math.min(...weights, 1);

  return edges.map(edge => {
    const sourceNode = nodeMap[typeof edge.source === 'object' ? edge.source.id : edge.source];
    const targetNode = nodeMap[typeof edge.target === 'object' ? edge.target.id : edge.target];
    const weight = edge[weightField] || 1;

    return {
      ...edge,
      // 权重信息
      weight,
      // 边的宽度
      strokeWidth: calculateEdgeWidth(weight, minWidth, maxWidth, minWeight, maxWeight),
      // 边的颜色（基于权重或方向性）
      color: mapEdgeColor(weight, maxWeight),
      // 边的透明度
      opacity: calculateEdgeOpacity(weight, maxWeight),
      // 边的曲率（用于曲线边）
      curvature: calculateEdgeCurvature(sourceNode, targetNode),
      // 边的类型（有向/无向）
      directed: edge.edge_type === 'cites' ? true : false
    };
  });
}

/**
 * 计算度数
 * @private
 */
function calculateDegrees(nodes, links) {
  const degrees = {};
  nodes.forEach(n => degrees[n.id] = 0);
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    degrees[sourceId] = (degrees[sourceId] || 0) + 1;
    degrees[targetId] = (degrees[targetId] || 0) + 1;
  });
  
  return degrees;
}

/**
 * 计算Betweenness Centrality（节点中心性）
 * @private
 */
function calculateBetweennessCentrality(nodes, links) {
  // 简化版本：使用加权度数作为近似
  const centrality = {};
  const degrees = calculateDegrees(nodes, links);
  const maxDegree = Math.max(...Object.values(degrees), 1);
  
  nodes.forEach(node => {
    centrality[node.id] = (degrees[node.id] || 0) / maxDegree;
  });
  
  return centrality;
}

/**
 * 计算节点大小
 * @private
 */
function calculateNodeSize(degree, minRadius, maxRadius, minDegree, maxDegree) {
  if (maxDegree === minDegree) return (minRadius + maxRadius) / 2;
  const normalized = (degree - minDegree) / (maxDegree - minDegree);
  return minRadius + normalized * (maxRadius - minRadius);
}

/**
 * 计算节点颜色
 * @private
 */
function mapNodeColor(node, degree, maxDegree, centrality, colorScheme, defaultColor) {
  if (node.color) return node.color; // 优先使用节点本身的颜色

  // 基于度数的颜色梯度
  if (colorScheme === 'degree') {
    const normalized = Math.min(degree / Math.max(maxDegree, 1), 1);
    return colorGradient(normalized);
  }

  // 基于中心性的颜色
  if (colorScheme === 'centrality' && centrality) {
    const c = centrality[node.id] || 0;
    return colorGradient(c);
  }

  // 基于节点类型
  if (colorScheme === 'type') {
    const nodeType = identifyNodeType(node);
    const colorMap = {
      'paper': '#FF6B6B',
      'author': '#4ECDC4',
      'venue': '#45B7D1',
      'unknown': defaultColor
    };
    return colorMap[nodeType] || defaultColor;
  }

  return defaultColor;
}

/**
 * 颜色渐变函数（从蓝到红）
 * @private
 */
function colorGradient(t) {
  // t: 0-1 从蓝色到红色的渐变
  const hue = (1 - t) * 240; // 蓝色(240°) 到 红色(0°)
  const saturation = 70 + t * 30; // 从70%到100%
  const lightness = 45 + (1 - Math.abs(t - 0.5)) * 10; // 中间亮度最高
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * 计算节点优先级（用于交互和动画）
 * @private
 */
function calculateNodePriority(node, degree, maxDegree) {
  // 优先级 = 度数占比 + 节点权重
  const degreeWeight = degree / Math.max(maxDegree, 1);
  const nodeWeight = node.citations ? Math.log(node.citations + 1) / Math.log(1000) : 0;
  return Math.min(degreeWeight * 0.7 + nodeWeight * 0.3, 1);
}

/**
 * 识别节点类型
 * @private
 */
function identifyNodeType(node) {
  if (node.node_type) return node.node_type;
  if (node.id.startsWith('W')) return 'paper';
  if (node.id.startsWith('A')) return 'author';
  if (node.id.startsWith('V')) return 'venue';
  return 'unknown';
}

/**
 * 计算边的宽度
 * @private
 */
function calculateEdgeWidth(weight, minWidth, maxWidth, minWeight, maxWeight) {
  if (maxWeight === minWeight) return (minWidth + maxWidth) / 2;
  const normalized = (weight - minWeight) / (maxWeight - minWeight);
  return minWidth + normalized * (maxWidth - minWidth);
}

/**
 * 计算边的颜色
 * @private
 */
function mapEdgeColor(weight, maxWeight) {
  const normalized = Math.min(weight / Math.max(maxWeight, 1), 1);
  // 低权重：浅灰色，高权重：深灰色
  const gray = Math.round(150 + (1 - normalized) * 100);
  return `rgb(${gray}, ${gray}, ${gray})`;
}

/**
 * 计算边的透明度
 * @private
 */
function calculateEdgeOpacity(weight, maxWeight) {
  const normalized = Math.min(weight / Math.max(maxWeight, 1), 1);
  return 0.2 + normalized * 0.4; // 0.2-0.6 之间的透明度
}

/**
 * 计算边的曲率（用于避免边重叠）
 * @private
 */
function calculateEdgeCurvature(sourceNode, targetNode) {
  if (!sourceNode || !targetNode) return 0;
  
  // 简单策略：同向边稍微弯曲
  // 实际应用中可以根据边的数量动态调整
  return 0.1;
}

/**
 * 批量数据映射入口函数
 * @param {Object} networkData - 后端返回的网络数据
 *   支持的格式：
 *   1. { nodes, edges } - 直接包含
 *   2. { nodes, edges, metadata } - 新结构
 *   3. { data: { nodes, edges } } - 包装结构
 * @param {Object} options - 全局选项
 * @returns {Object} 完整的映射数据
 */
export function mapNetworkData(networkData, options = {}) {
  // 处理多种响应结构
  let nodes = [];
  let edges = [];
  let metadata = {};

  if (!networkData) {
    console.warn('mapNetworkData: received null or undefined networkData');
    return {
      nodes: [],
      edges: [],
      nodeMap: {},
      metadata: {
        totalNodes: 0,
        totalEdges: 0,
        maxDegree: 0,
        minDegree: 0,
        avgDegree: 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  // 支持多种响应格式
  if (networkData.data) {
    // 格式: { data: { nodes, edges, metadata } }
    const innerData = networkData.data;
    nodes = innerData.nodes || [];
    edges = innerData.edges || [];
    metadata = innerData.metadata || {};
  } else if (networkData.nodes || networkData.edges) {
    // 格式: 直接包含 nodes/edges
    nodes = networkData.nodes || [];
    edges = networkData.edges || [];
    metadata = networkData.metadata || {};
  } else {
    console.warn('mapNetworkData: unable to extract nodes/edges from', networkData);
    return {
      nodes: [],
      edges: [],
      nodeMap: {},
      metadata: {
        totalNodes: 0,
        totalEdges: 0,
        maxDegree: 0,
        minDegree: 0,
        avgDegree: 0,
        timestamp: new Date().toISOString()
      }
    };
  }

  // 第一步：映射节点
  const mappedNodes = mapNodeData(nodes, edges, options.nodeOptions);

  // 第二步：创建节点映射表
  const nodeMap = {};
  mappedNodes.forEach(node => {
    nodeMap[node.id] = node;
  });

  // 第三步：映射边
  const mappedEdges = mapEdgeData(edges, nodeMap, options.edgeOptions);

  return {
    nodes: mappedNodes,
    edges: mappedEdges,
    nodeMap,
    metadata: {
      ...metadata,
      totalNodes: mappedNodes.length,
      totalEdges: mappedEdges.length,
      maxDegree: Math.max(...mappedNodes.map(n => n.degree), 0),
      minDegree: Math.min(...mappedNodes.map(n => n.degree), 0),
      avgDegree: mappedNodes.reduce((sum, n) => sum + n.degree, 0) / mappedNodes.length || 0,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * 提取节点统计数据用于图例和工具提示
 * @param {Array} mappedNodes - 映射后的节点
 * @returns {Object} 统计信息
 */
export function extractNodeStats(mappedNodes) {
  const typeStats = {};
  const degreeStats = {
    values: [],
    quartiles: []
  };

  mappedNodes.forEach(node => {
    const type = node.nodeType;
    typeStats[type] = (typeStats[type] || 0) + 1;
    degreeStats.values.push(node.degree);
  });

  degreeStats.values.sort((a, b) => a - b);
  const q1Idx = Math.floor(degreeStats.values.length * 0.25);
  const q2Idx = Math.floor(degreeStats.values.length * 0.5);
  const q3Idx = Math.floor(degreeStats.values.length * 0.75);

  degreeStats.quartiles = [
    degreeStats.values[q1Idx],
    degreeStats.values[q2Idx],
    degreeStats.values[q3Idx]
  ];

  return {
    typeStats,
    degreeStats,
    totalNodes: mappedNodes.length,
    nodeTypes: Object.keys(typeStats)
  };
}
