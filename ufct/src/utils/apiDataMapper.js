/**
 * API 数据映射器 - 将后端 API 返回的数据转换为前端组件能够使用的格式
 * 处理真实的 API 响应格式转换
 */

/**
 * 将后端返回的节点数据转换为前端格式
 * 后端返回格式（新版本，没有 color 和 size）:
 * {
 *   "id": "https://openalex.org/W2896457183",
 *   "label": "论文标题",
 *   "node_type": "paper",
 *   "metadata": {
 *     "citation_count": 44872,
 *     "title": "完整标题",
 *     "url": "",
 *     "venue": "Unknown",
 *     "year": 2020
 *   }
 * }
 * 
 * 前端需要格式（动态计算 size 和 color）:
 * {
 *   "id": "W123456789",
 *   "label": "论文标题",
 *   "title": "论文完整标题",
 *   "year": 2023,
 *   "citations": 15,
 *   "citationCount": 15,
 *   // size 和 color 将在后续由 NetworkGraph 动态计算
 * }
 */
export function transformCitationNodes(apiNodes) {
  if (!Array.isArray(apiNodes)) {
    console.warn('Invalid nodes format:', apiNodes);
    return [];
  }

  return apiNodes.map(node => {
    const { metadata = {} } = node;
    
    return {
      // 基础字段
      id: node.id,
      label: node.label || metadata.title || '',
      
      // 来自 metadata 的字段
      title: metadata.title || node.label || '',
      year: metadata.year || new Date().getFullYear(),
      citations: metadata.citation_count || 0,
      citationCount: metadata.citation_count || 0,
      venue: metadata.venue || 'Unknown',
      url: metadata.url || '',
      
      // 节点类型
      nodeType: node.node_type || 'paper',
      
      // 保留原始元数据以备查询
      metadata: metadata,
      
      // 注：size 和 color 将由 NetworkGraph 中的方法动态计算
    };
  });
}

/**
 * 将后端返回的边数据转换为前端格式
 * 后端返回格式（新版本，没有 label）:
 * {
 *   "source": "https://openalex.org/W3118615836",
 *   "target": "https://openalex.org/W3123893780",
 *   "edge_type": "cites",
 *   "weight": 1,
 *   "metadata": { "citation_type": "direct" }
 * }
 * 
 * 前端需要格式:
 * {
 *   "source": "W123456789",
 *   "target": "W987654321",
 *   "weight": 1,  // 表示引用计数/协作次数
 *   ...
 * }
 */
export function transformCitationEdges(apiEdges) {
  if (!Array.isArray(apiEdges)) {
    console.warn('Invalid edges format:', apiEdges);
    return [];
  }

  return apiEdges.map(edge => {
    return {
      source: edge.source,
      target: edge.target,
      weight: edge.weight || 1,
      edgeType: edge.edge_type || 'cites',
      // label 已删除，改用 weight 表示边的强度
      metadata: edge.metadata || {}
    };
  });
}

/**
 * 处理完整的 API 响应（论文引用网络）
 * @param {Object} apiResponse - 后端 API 返回的数据 (已去掉最外层的 { status, data, ... })
 *   这是 fetchCitationNetwork 返回的 result.data，包含：
 *   {
 *     "nodes": [
 *       {
 *         "id": "W1234567890",
 *         "label": "Deep Learning for NLP",
 *         "node_type": "paper",
 *         "metadata": {
 *           "title": "Complete Paper Title",
 *           "year": 2023,
 *           "citation_count": 150,
 *           "venue": "ACL",
 *           "url": "https://..."
 *         }
 *       }
 *     ],
 *     "edges": [
 *       {
 *         "source": "W1234567890",
 *         "target": "W0987654321",
 *         "edge_type": "cites",
 *         "weight": 2.0,
 *         "metadata": { "citation_type": "direct" }
 *       }
 *     ],
 *     "metadata": {
 *       "total_nodes": 500,
 *       "total_edges": 1200,
 *       "network_density": 0.0048,
 *       "avg_degree": 4.8
 *     }
 *   }
 * @returns {Object} { nodes, links, stats }
 */
export function processApiCitationResponse(apiResponse) {
  try {
    if (!apiResponse) {
      console.error('Invalid API response structure: response is null or undefined');
      return { nodes: [], links: [], stats: null };
    }

    // apiResponse 应该直接包含 { nodes, edges, metadata }
    // 支持兼容性：如果嵌套在 data 中，则解包
    const data = apiResponse.data || apiResponse;
    
    if (!data || (!data.nodes && !data.network)) {
      console.error('Invalid API response structure: missing nodes/edges');
      console.error('Response structure:', apiResponse);
      console.error('Data structure:', data);
      return { nodes: [], links: [], stats: null };
    }

    // 处理节点和边 - 支持新旧两种结构
    const nodesList = data.nodes || (data.network && data.network.nodes) || [];
    const edgesList = data.edges || (data.network && data.network.edges) || [];
    
    const nodes = transformCitationNodes(nodesList);
    const links = transformCitationEdges(edgesList);

    // 统计信息可能在 metadata、summary 或 statistics 中
    const stats = data.metadata || apiResponse.summary || {};

    return {
      nodes,
      links,
      stats
    };
  } catch (error) {
    console.error('Error processing API citation response:', error);
    console.error('Response was:', apiResponse);
    return { nodes: [], links: [], stats: null };
  }
}

/**
 * 处理作者协作网络的 API 响应
 * @param {Object} apiResponse - 后端 API 返回的数据 (已去掉最外层的 { status, data, ... })
 * @returns {Object} { nodes, links, stats, communities }
 */
export function processApiCollaborationResponse(apiResponse) {
  try {
    if (!apiResponse) {
      console.error('Invalid API response structure: response is null or undefined');
      return { nodes: [], links: [], stats: null, communities: [] };
    }

    console.log('📊 处理协作网络API响应:', { 
      hasNodes: !!apiResponse.nodes, 
      nodeCount: apiResponse.nodes?.length,
      hasEdges: !!apiResponse.edges,
      edgeCount: apiResponse.edges?.length
    });

    // apiResponse 应该直接包含 { nodes, edges, metadata }
    // 支持兼容性：如果嵌套在 data 中，则解包
    const data = apiResponse.data || apiResponse;
    
    if (!data || (!data.nodes && !data.network)) {
      console.error('Invalid API response structure: missing nodes/edges');
      return { nodes: [], links: [], stats: null, communities: [] };
    }

    // 处理节点和边 - 支持新旧两种结构
    const nodesList = data.nodes || (data.network && data.network.nodes) || [];
    const edgesList = data.edges || (data.network && data.network.edges) || [];
    
    console.log('✓ 从响应中提取数据:', { nodes: nodesList.length, edges: edgesList.length });
    
    // 转换节点
    const nodes = transformCollaborationNodes(nodesList);
    
    // 转换边
    const links = transformCollaborationEdges(edgesList);

    // 统计信息可能在 metadata、summary 或 statistics 中
    const stats = data.metadata || apiResponse.summary || {};
    
    // 社区信息
    const communities = data.communities || [];

    console.log('✓ 数据转换完成:', { nodes: nodes.length, links: links.length, communities: communities.length });

    return {
      nodes,
      links,
      stats,
      communities
    };
  } catch (error) {
    console.error('Error processing API collaboration response:', error);
    console.error('Response was:', apiResponse);
    return { nodes: [], links: [], stats: null, communities: [] };
  }
}

/**
 * 将后端返回的作者节点转换为前端格式
 */
export function transformCollaborationNodes(apiNodes) {
  if (!Array.isArray(apiNodes)) {
    console.warn('❌ transformCollaborationNodes: 节点不是数组', apiNodes);
    return [];
  }

  const transformedNodes = apiNodes.map(node => {
    // 从 metadata 中提取作者信息
    const metadata = node.metadata || {};
    
    const transformed = {
      id: node.id,
      label: node.label || metadata.name || '',
      
      // 作者基本信息（从 metadata 中提取）
      name: metadata.name || node.label || '',
      orcid: metadata.orcid || '',
      paperCount: metadata.paper_count || 0,
      
      // 协作信息（兼容旧格式）
      collaborations: node.collaborations || 0,
      papers: node.papers || metadata.paper_count || 0,
      hIndex: node.h_index || 0,
      
      // 可视化属性
      size: node.size || 6,
      community: node.community || 0,
      color: node.color || '#1f77b4',
      
      // 节点类型
      nodeType: node.node_type || 'author',
      
      // 保留原始 metadata
      metadata: metadata
    };
    return transformed;
  });

  return transformedNodes;
}

/**
 * 将后端返回的作者协作边转换为前端格式
 */
export function transformCollaborationEdges(apiEdges) {
  if (!Array.isArray(apiEdges)) {
    console.warn('❌ transformCollaborationEdges: 边不是数组', apiEdges);
    return [];
  }

  console.log('🔄 transformCollaborationEdges 开始转换:', {
    inputEdgeCount: apiEdges.length,
    firstRawEdge: apiEdges[0],
    sampleRawEdges: apiEdges.slice(0, 2)
  });

  const transformedEdges = apiEdges.map(edge => {
    return {
      source: edge.source,
      target: edge.target,
      weight: edge.weight || 1,
      papers: edge.papers || [],
      label: `${edge.weight || 1} 篇论文`
    };
  });

  return transformedEdges;
}

/**
 * 验证节点和边的数据完整性
 */
export function validateNetworkData(nodes, links) {
  const issues = [];

  // 检查节点
  if (!Array.isArray(nodes) || nodes.length === 0) {
    issues.push('Nodes must be a non-empty array');
  }

  nodes.forEach((node, index) => {
    if (!node.id) {
      issues.push(`Node at index ${index} missing required field: id`);
    }
    if (!node.label) {
      issues.push(`Node ${node.id} missing required field: label`);
    }
  });

  // 检查边
  if (!Array.isArray(links)) {
    issues.push('Links must be an array');
  }

  links.forEach((link, index) => {
    if (!link.source || !link.target) {
      issues.push(`Link at index ${index} missing required fields: source or target`);
    }
  });

  // 检查节点引用完整性
  const nodeIds = new Set(nodes.map(n => n.id));
  links.forEach((link, index) => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    if (!nodeIds.has(sourceId)) {
      issues.push(`Link at index ${index} references unknown source node: ${sourceId}`);
    }
    if (!nodeIds.has(targetId)) {
      issues.push(`Link at index ${index} references unknown target node: ${targetId}`);
    }
  });

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * 计算节点在可视化中的属性（大小、颜色等）
 * 基于真实的节点属性而不是模拟数据
 */
export function calculateNodeVisualizationProps(nodes, links) {
  // 计算每个节点的度数
  const degrees = {};
  nodes.forEach(node => {
    degrees[node.id] = 0;
  });

  links.forEach(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    
    if (degrees[sourceId] !== undefined) degrees[sourceId]++;
    if (degrees[targetId] !== undefined) degrees[targetId]++;
  });

  // 计算大小：基于被引用次数或度数
  const citationCounts = nodes.map(n => n.citations || n.citationCount || degrees[n.id] || 0);
  const minCitations = Math.min(...citationCounts);
  const maxCitations = Math.max(...citationCounts);
  const citationRange = maxCitations - minCitations || 1;

  const sizes = {};
  nodes.forEach(node => {
    const citations = node.citations || node.citationCount || degrees[node.id] || 0;
    // 映射到 5-30 的范围
    sizes[node.id] = 5 + ((citations - minCitations) / citationRange) * 25;
  });

  // 计算颜色：基于年份或度数
  const years = nodes.map(n => n.year || 2020);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  const yearRange = maxYear - minYear || 1;

  const colors = {};
  const colorScale = (value) => {
    // 简单的线性颜色映射，不依赖 d3
    const normalized = (value - minYear) / yearRange; // 0-1
    const hue = normalized * 240; // 0-240 (蓝到红)
    return `hsl(${hue}, 70%, 50%)`;
  };


  nodes.forEach(node => {
    colors[node.id] = node.color || colorScale(node.year || 2020);
  });

  return { sizes, colors, degrees };
}

/**
 * 处理论文统计数据响应 - T2 功能
 * @param {Object} apiResponse - 后端 API 返回的数据
 *   {
 *     "timeline": [...],
 *     "global_histogram": [...],
 *     "histogram_by_year": {...},
 *     "metadata": {...}
 *   }
 * @returns {Object} { timeline, globalHistogram, histogramByYear, metadata }
 */
export function processPaperStatisticsResponse(apiResponse) {
  try {
    if (!apiResponse) {
      console.error('Invalid statistics response: response is null or undefined');
      return {
        timeline: [],
        globalHistogram: [],
        histogramByYear: {},
        metadata: null
      };
    }

    console.log('📊 Processing statistics response:', {
      hasTimeline: !!apiResponse.timeline,
      timelinePoints: apiResponse.timeline?.length,
      hasHistogram: !!apiResponse.global_histogram,
      histogramBins: apiResponse.global_histogram?.length,
      histogramYears: Object.keys(apiResponse.histogram_by_year || {}).length
    });

    // 处理时间线数据
    const timeline = (apiResponse.timeline || []).map(item => ({
      year: item.year,
      paperCount: item.paperCount,
      growth_rate: item.growth_rate || null
    }));

    // 处理全局直方图数据
    const globalHistogram = (apiResponse.global_histogram || []).map(bin => ({
      bin_range: bin.bin_range,
      bin_start: bin.bin_start,
      bin_end: bin.bin_end,
      count: bin.count,
      percentage: bin.percentage
    }));

    // 处理按年份的直方图数据
    const histogramByYear = {};
    if (apiResponse.histogram_by_year) {
      Object.keys(apiResponse.histogram_by_year).forEach(year => {
        histogramByYear[year] = (apiResponse.histogram_by_year[year] || []).map(bin => ({
          bin_range: bin.bin_range,
          bin_start: bin.bin_start,
          bin_end: bin.bin_end,
          count: bin.count,
          percentage: bin.percentage
        }));
      });
    }

    // 处理元数据 - 确保所有字段都有默认值
    // 支持两种数据格式：专利数据和引用数据
    const metadata = apiResponse.metadata ? {
      total_papers: apiResponse.metadata.total_papers || 0,
      // 兼容两种格式：专利数据 (total_patents) 或引用数据 (total_citations)
      total_citations: apiResponse.metadata.total_citations !== undefined 
        ? apiResponse.metadata.total_citations 
        : (apiResponse.metadata.total_patents !== undefined 
          ? apiResponse.metadata.total_patents 
          : 0),
      // 平均值：兼容 avg_citation_count_per_paper 或 avg_patent_count_per_paper
      avg_citation_count_per_paper: apiResponse.metadata.avg_citation_count_per_paper !== undefined 
        ? apiResponse.metadata.avg_citation_count_per_paper 
        : (apiResponse.metadata.avg_patent_count_per_paper !== undefined 
          ? apiResponse.metadata.avg_patent_count_per_paper 
          : 0),
      // 最大值
      max_citation_count: apiResponse.metadata.max_citation_count !== undefined 
        ? apiResponse.metadata.max_citation_count 
        : (apiResponse.metadata.max_patent_count !== undefined 
          ? apiResponse.metadata.max_patent_count 
          : 0),
      // 最小值
      min_citation_count: apiResponse.metadata.min_citation_count !== undefined 
        ? apiResponse.metadata.min_citation_count 
        : (apiResponse.metadata.min_patent_count !== undefined 
          ? apiResponse.metadata.min_patent_count 
          : 0),
      // 标准差
      citation_count_std_dev: apiResponse.metadata.citation_count_std_dev !== undefined 
        ? apiResponse.metadata.citation_count_std_dev 
        : (apiResponse.metadata.patent_count_std_dev !== undefined 
          ? apiResponse.metadata.patent_count_std_dev 
          : 0),
      year_range: apiResponse.metadata.year_range || { min: 2015, max: 2024 }
    } : {
      total_papers: 0,
      total_citations: 0,
      avg_citation_count_per_paper: 0,
      max_citation_count: 0,
      min_citation_count: 0,
      citation_count_std_dev: 0,
      year_range: { min: 2015, max: 2024 }
    };

    return {
      timeline,
      globalHistogram,
      histogramByYear,
      metadata
    };
  } catch (error) {
    console.error('Error processing statistics response:', error);
    return {
      timeline: [],
      globalHistogram: [],
      histogramByYear: {},
      metadata: null
    };
  }
}

