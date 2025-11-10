/**
 * Web Worker - 后台处理图数据，避免阻塞主线程
 * 用于处理: 节点过滤、度数计算、颜色生成等耗时操作
 */

self.onmessage = function(event) {
  const { type, payload } = event.data;

  try {
    let result;

    switch (type) {
      case 'calculateDegrees':
        result = calculateNodeDegrees(payload.nodes, payload.links);
        break;
      
      case 'optimizeGraph':
        result = optimizeGraphForPerformance(
          payload.nodes,
          payload.links,
          payload.threshold,
          payload.options
        );
        break;
      
      case 'generateColors':
        result = generateNodeColors(payload.nodes, payload.links);
        break;
      
      case 'calculateSizes':
        result = calculateNodeSizes(
          payload.degrees,
          payload.minSize,
          payload.maxSize
        );
        break;
      
      case 'cleanData':
        result = {
          nodes: cleanNodes(payload.nodes),
          links: cleanLinks(payload.links)
        };
        break;
      
      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    self.postMessage({
      success: true,
      type,
      result
    });
  } catch (error) {
    self.postMessage({
      success: false,
      type,
      error: error.message
    });
  }
};

/**
 * 清理节点数据
 */
function cleanNodes(nodes) {
  const seen = new Set();
  return nodes.filter(node => {
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return true;
  });
}

/**
 * 清理链接数据
 */
function cleanLinks(links) {
  const seen = new Set();
  return links.filter(link => {
    if (link.source === link.target) return false;
    
    const id = [link.source, link.target].sort().join('-');
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/**
 * 计算节点度数
 */
function calculateNodeDegrees(nodes, links) {
  const degrees = {};
  
  nodes.forEach(node => {
    degrees[node.id] = 0;
  });
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    if (degrees.hasOwnProperty(sourceId)) degrees[sourceId]++;
    if (degrees.hasOwnProperty(targetId)) degrees[targetId]++;
  });
  
  return degrees;
}

/**
 * 计算节点大小
 */
function calculateNodeSizes(degrees, minSize = 5, maxSize = 30) {
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
 * 生成节点颜色
 */
function generateNodeColors(nodes, links) {
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

/**
 * 优化图性能
 */
function optimizeGraphForPerformance(nodes, links, threshold = 2, options = {}) {
  const {
    maxNodes = 1500,
    preserveTopPercent = 0.15,
    enableCommunityMerge = true,
    samplingRate = 1.0
  } = options;

  if (nodes.length <= maxNodes) {
    return {
      nodes,
      links,
      filteredCount: 0,
      compressionRate: 0,
      optimizationLevel: 'none'
    };
  }

  const degrees = calculateNodeDegrees(nodes, links);
  const degreeEntries = Object.entries(degrees);
  
  const sortedByDegree = degreeEntries.sort((a, b) => b[1] - a[1]);
  
  const dynamicThreshold = calculateDynamicThreshold(degrees, maxNodes, threshold);
  
  const importantNodeIds = new Set(
    degreeEntries
      .filter(([, degree]) => degree >= dynamicThreshold)
      .map(([id]) => id)
  );
  
  const topNodeCount = Math.max(
    Math.ceil(nodes.length * preserveTopPercent),
    Math.max(50, Math.ceil(maxNodes * 0.2))
  );
  const topDegreeNodeIds = new Set(
    sortedByDegree
      .slice(0, topNodeCount)
      .map(([id]) => id)
  );
  
  let filteredNodeIds = new Set([...importantNodeIds, ...topDegreeNodeIds]);
  
  if (enableCommunityMerge && filteredNodeIds.size > maxNodes * 0.8) {
    const communityMerged = mergeNodeCommunities(
      Array.from(filteredNodeIds).map(id => ({ id, degree: degrees[id] })),
      links,
      Math.ceil(maxNodes * 0.7)
    );
    filteredNodeIds = new Set(communityMerged.map(n => n.id));
  }
  
  if (filteredNodeIds.size > maxNodes) {
    filteredNodeIds = randomSampleNodes(filteredNodeIds, maxNodes);
  }
  
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
 */
function calculateDynamicThreshold(degrees, targetNodes, minThreshold) {
  const degreeValues = Object.values(degrees).sort((a, b) => b - a);
  if (degreeValues.length <= targetNodes) return minThreshold;
  
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
 * 社区合并
 */
function mergeNodeCommunities(nodes, links, targetCount) {
  if (nodes.length <= targetCount) return nodes;
  
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
  
  const sortedNodes = [...nodes].sort((a, b) => a.degree - b.degree);
  const result = new Set(sortedNodes.map(n => n.id));
  
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
        if (nodeB.degree > nodeA.degree + 2) continue;
        
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
 * 随机采样
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
  
  if (result.size < targetCount) {
    const remaining = array.filter(id => !result.has(id));
    const needed = targetCount - result.size;
    for (let i = 0; i < needed && i < remaining.length; i++) {
      result.add(remaining[i]);
    }
  }
  
  return result;
}
