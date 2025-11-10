/**
 * 图形工具库 - 用于图数据处理和布局计算
 */

/**
 * 清理节点数据，移除重复并标准化
 * @param {Array} nodes - 原始节点数组
 * @returns {Array} 清理后的节点数组
 */
export function cleanNodes(nodes) {
  const seen = new Set();
  return nodes.filter(node => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

/**
 * 清理边数据，移除自环和重复边
 * @param {Array} links - 原始链接数组
 * @returns {Array} 清理后的链接数组
 */
export function cleanLinks(links) {
  const seen = new Set();
  return links.filter(link => {
    // 移除自环
    if (link.source === link.target) return false;
    
    // 标准化边的方向（创建唯一标识符）
    const id = [link.source, link.target].sort().join('-');
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * 计算节点的度数（连接数）
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 链接数组
 * @returns {Object} 节点ID -> 度数的映射
 */
export function calculateNodeDegrees(nodes, links) {
  const degrees = {};
  
  nodes.forEach(node => {
    degrees[node.id] = 0;
  });
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    if (Object.prototype.hasOwnProperty.call(degrees, sourceId)) degrees[sourceId]++;
    if (Object.prototype.hasOwnProperty.call(degrees, targetId)) degrees[targetId]++;
  });
  
  return degrees;
}

/**
 * 计算节点大小 - 基于度数的力度算法
 * @param {Object} degrees - 节点度数映射
 * @param {number} minSize - 最小节点大小
 * @param {number} maxSize - 最大节点大小
 * @returns {Object} 节点ID -> 大小的映射
 */
export function calculateNodeSizes(degrees, minSize = 5, maxSize = 30) {
  const degreeValues = Object.values(degrees);
  const maxDegree = Math.max(...degreeValues);
  const minDegree = Math.min(...degreeValues);
  
  const sizes = {};
  const scale = (maxDegree - minDegree) || 1;
  
  Object.entries(degrees).forEach(([nodeId, degree]) => {
    sizes[nodeId] = minSize + ((degree - minDegree) / scale) * (maxSize - minSize);
  });
  
  return sizes;
}

/**
 * 检测图中的孤立节点
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 链接数组
 * @returns {Array} 孤立节点数组
 */
export function detectIsolatedNodes(nodes, links) {
  const connectedIds = new Set();
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    connectedIds.add(sourceId);
    connectedIds.add(targetId);
  });
  
  return nodes.filter(node => !connectedIds.has(node.id));
}

/**
 * 应用聚类算法优化 - 通过减少节点数量来改善性能
 * 支持多层级采样策略、动态阈值调整和社区聚合
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 链接数组
 * @param {number} threshold - 度数阈值（低于此值的节点将被过滤）
 * @param {Object} options - 优化选项
 * @returns {Object} 包含过滤后的节点和链接
 */
export function optimizeGraphForPerformance(nodes, links, threshold = 2, options = {}) {
  const {
    maxNodes = 1500,           // 最大节点数目标
    preserveTopPercent = 0.15, // 保留度数最高的百分比
    enableCommunityMerge = true, // 启用社区合并
  } = options;

  if (nodes.length <= maxNodes) {
    // 节点数在可接受范围内，只进行基本清理
    return {
      nodes,
      links,
      filteredCount: 0,
      optimizationLevel: 'none'
    };
  }

  // 计算度数
  const degrees = calculateNodeDegrees(nodes, links);
  const degreeEntries = Object.entries(degrees);
  
  // 按度数排序
  const sortedByDegree = degreeEntries.sort((a, b) => b[1] - a[1]);
  
  // 动态计算阈值：根据目标节点数自动调整
  const dynamicThreshold = calculateDynamicThreshold(degrees, maxNodes, threshold);
  
  // 第一层：度数阈值过滤
  const importantNodeIds = new Set(
    degreeEntries
      .filter(([, degree]) => degree >= dynamicThreshold)
      .map(([id]) => id)
  );
  
  // 第二层：保留高度数节点
  const topNodeCount = Math.max(
    Math.ceil(nodes.length * preserveTopPercent),
    Math.max(50, Math.ceil(maxNodes * 0.2))
  );
  const topDegreeNodeIds = new Set(
    sortedByDegree
      .slice(0, topNodeCount)
      .map(([id]) => id)
  );
  
  // 合并两层结果
  let filteredNodeIds = new Set([...importantNodeIds, ...topDegreeNodeIds]);
  
  // 第三层：社区合并（可选）
  if (enableCommunityMerge && filteredNodeIds.size > maxNodes * 0.8) {
    const communityMerged = mergeNodeCommunities(
      Array.from(filteredNodeIds).map(id => ({ id, degree: degrees[id] })),
      links,
      Math.ceil(maxNodes * 0.7)
    );
    filteredNodeIds = new Set(communityMerged.map(n => n.id));
  }
  
  // 第四层：随机采样（如果仍然过多）
  if (filteredNodeIds.size > maxNodes) {
    filteredNodeIds = randomSampleNodes(filteredNodeIds, maxNodes);
  }
  
  // 过滤节点和链接
  const optimizedNodes = nodes.filter(node => filteredNodeIds.has(node.id));
  const optimizedLinks = links.filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
  });
  
  const compressionRate = 1 - (optimizedNodes.length / nodes.length);
  
  return {
    nodes: optimizedNodes,
    links: optimizedLinks,
    filteredCount: nodes.length - optimizedNodes.length,
    compressionRate: Math.round(compressionRate * 100),
    optimizationLevel: compressionRate > 0.8 ? 'heavy' : compressionRate > 0.5 ? 'moderate' : 'light'
  };
}

/**
 * 计算动态阈值
 * @private
 */
function calculateDynamicThreshold(degrees, targetNodes, minThreshold) {
  const degreeValues = Object.values(degrees).sort((a, b) => b - a);
  if (degreeValues.length <= targetNodes) return minThreshold;
  
  // 二分查找合适的阈值
  let low = minThreshold;
  let high = Math.max(...degreeValues);
  let bestThreshold = minThreshold;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const count = degreeValues.filter(d => d >= mid).length;
    
    if (count >= targetNodes * 0.6 && count <= targetNodes * 1.2) {
      bestThreshold = mid;
      break;
    } else if (count > targetNodes * 1.2) {
      low = mid + 1;
    } else {
      high = mid - 1;
      bestThreshold = mid;
    }
  }
  
  return bestThreshold;
}

/**
 * 社区合并 - 将相似的低度节点合并
 * @private
 */
function mergeNodeCommunities(nodes, links, targetCount) {
  if (nodes.length <= targetCount) return nodes;
  
  // 构建邻接表
  const adjacency = new Map();
  nodes.forEach(node => adjacency.set(node.id, new Set()));
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    if (adjacency.has(sourceId) && adjacency.has(targetId)) {
      adjacency.get(sourceId).add(targetId);
      adjacency.get(targetId).add(sourceId);
    }
  });
  
  // 按度数升序排列，低度节点优先合并
  const sortedNodes = [...nodes].sort((a, b) => a.degree - b.degree);
  const result = new Set(sortedNodes.map(n => n.id));
  
  // 贪心算法：合并最相似的低度节点
  while (result.size > targetCount && sortedNodes.length > 0) {
    let bestPair = null;
    let maxSimilarity = -1;
    
    for (let i = 0; i < Math.min(sortedNodes.length, 10); i++) {
      const nodeA = sortedNodes[i];
      if (!result.has(nodeA.id)) continue;
      
      const neighborsA = adjacency.get(nodeA.id) || new Set();
      for (const neighborId of neighborsA) {
        if (!result.has(neighborId)) continue;
        
        const nodeB = nodes.find(n => n.id === neighborId);
        if (nodeB.degree > nodeA.degree + 2) continue; // 避免合并相差过大的节点
        
        // 计算相似度（共同邻居数）
        const neighborsB = adjacency.get(neighborId) || new Set();
        const commonNeighbors = [...neighborsA].filter(id => neighborsB.has(id)).length;
        
        if (commonNeighbors > maxSimilarity) {
          maxSimilarity = commonNeighbors;
          bestPair = nodeA.id;
        }
      }
    }
    
    if (bestPair) {
      result.delete(bestPair);
      sortedNodes.shift();
    } else {
      break;
    }
  }
  
  return nodes.filter(n => result.has(n.id));
}

/**
 * 随机采样节点
 * @private
 */
function randomSampleNodes(nodeIds, targetCount) {
  if (nodeIds.size <= targetCount) return nodeIds;
  
  const array = Array.from(nodeIds);
  const result = new Set();
  const sampleRate = targetCount / nodeIds.size;
  
  for (const nodeId of array) {
    if (Math.random() < sampleRate) {
      result.add(nodeId);
    }
  }
  
  // 确保至少达到目标数
  if (result.size < targetCount) {
    const remaining = array.filter(id => !result.has(id));
    const needed = targetCount - result.size;
    for (let i = 0; i < needed && i < remaining.length; i++) {
      result.add(remaining[i]);
    }
  }
  
  return result;
}

/**
 * 获取节点的邻居信息
 * @param {string} nodeId - 节点ID
 * @param {Array} links - 链接数组
 * @returns {Object} 包含邻接节点和连接信息
 */
export function getNodeNeighbors(nodeId, links) {
  const neighbors = {
    incoming: [],
    outgoing: [],
    total: 0
  };
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    if (sourceId === nodeId) {
      neighbors.outgoing.push(targetId);
    }
    if (targetId === nodeId) {
      neighbors.incoming.push(sourceId);
    }
  });
  
  neighbors.total = neighbors.incoming.length + neighbors.outgoing.length;
  return neighbors;
}

/**
 * 生成节点颜色 - 基于社区检测或度数
 * @param {Array} nodes - 节点数组
 * @param {Array} links - 链接数组
 * @returns {Object} 节点ID -> 颜色的映射
 */
export function generateNodeColors(nodes, links) {
  const colors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
  ];
  
  const degrees = calculateNodeDegrees(nodes, links);
  const nodeColors = {};
  
  nodes.forEach(node => {
    const degree = degrees[node.id] || 0;
    const colorIndex = degree % colors.length;
    nodeColors[node.id] = colors[colorIndex];
  });
  
  return nodeColors;
}
