/**
 * API 响应数据格式检查工具
 * 
 * 用于验证 API 返回的数据结构是否正确
 */

// 期望的 API 响应格式
const EXPECTED_API_STRUCTURE = {
  nodes: [
    {
      id: "string - 作者ID (URL格式)",
      label: "string - 作者名称",
      node_type: "string - 节点类型 (author)",
      metadata: {
        name: "string - 完整作者名",
        orcid: "string - ORCID链接",
        paper_count: "number - 论文数量"
      },
      size: "number (可选) - 节点大小",
      community: "number (可选) - 社区编号",
      color: "string (可选) - 节点颜色"
    }
  ],
  edges: [
    {
      source: "string - 源作者ID",
      target: "string - 目标作者ID",
      weight: "number - 合作强度",
      papers: "array (可选) - 合作论文列表"
    }
  ],
  metadata: {
    total_nodes: "number",
    total_edges: "number",
    network_density: "number",
    avg_degree: "number"
  }
};

// 转换后的前端格式
const EXPECTED_FRONTEND_STRUCTURE = {
  nodes: [
    {
      id: "string - 作者ID",
      label: "string - 作者名称",
      name: "string - 作者完整名 (从 metadata.name 获取)",
      orcid: "string - ORCID (从 metadata.orcid 获取)",
      paperCount: "number - 论文数量 (从 metadata.paper_count 转换)",
      // 兼容旧格式的字段
      collaborations: "number - 协作者数量",
      papers: "number - 论文数量",
      hIndex: "number - H指数",
      size: "number - 节点大小",
      community: "number - 社区编号",
      color: "string - 节点颜色",
      nodeType: "string - 节点类型",
      metadata: "object - 原始 metadata"
    }
  ],
  edges: [
    {
      source: "string - 源作者ID",
      target: "string - 目标作者ID",
      weight: "number - 合作强度",
      papers: "array - 合作论文列表",
      label: "string - 边标签"
    }
  ]
};

// 诊断函数
window.$validateAPIResponse = function(apiResponse) {
  console.clear();
  console.log('%c=== API 响应格式验证 ===', 'color: #1f77b4; font-size: 16px; font-weight: bold;');
  
  const report = {
    valid: true,
    warnings: [],
    errors: []
  };
  
  // 检查顶层结构
  if (!apiResponse) {
    report.errors.push('❌ API 响应为 null 或 undefined');
    report.valid = false;
  } else {
    // 检查 nodes
    if (!apiResponse.nodes || !Array.isArray(apiResponse.nodes)) {
      report.errors.push('❌ 缺少 "nodes" 字段或格式错误');
      report.valid = false;
    } else {
      console.log(`✓ nodes 字段存在，共 ${apiResponse.nodes.length} 个`);
      
      // 检查第一个节点的字段
      if (apiResponse.nodes.length > 0) {
        const firstNode = apiResponse.nodes[0];
        console.log('%c第一个节点检查:', 'color: #FF9800; font-weight: bold;');
        
        // 检查顶层必需字段
        const requiredTopLevelFields = ['id', 'label', 'node_type'];
        requiredTopLevelFields.forEach(field => {
          if (!(field in firstNode)) {
            report.errors.push(`❌ nodes[0] 缺少字段: "${field}"`);
            report.valid = false;
          } else {
            console.log(`  ✓ ${field}: ${firstNode[field]}`);
          }
        });
        
        // 检查 metadata 中的字段
        console.log('%cMetadata 字段检查:', 'color: #FF9800; font-weight: bold;');
        const metadata = firstNode.metadata || {};
        const requiredMetadataFields = ['name', 'orcid', 'paper_count'];
        requiredMetadataFields.forEach(field => {
          if (!(field in metadata)) {
            report.warnings.push(`⚠️ metadata 缺少字段: "${field}"`);
          } else {
            console.log(`  ✓ metadata.${field}: ${metadata[field]}`);
          }
        });
        
        // 检查数据类型
        console.log('%c数据类型检查:', 'color: #4CAF50; font-weight: bold;');
        const typeChecks = {
          id: ['string', typeof firstNode.id],
          label: ['string', typeof firstNode.label],
          node_type: ['string', typeof firstNode.node_type],
          'metadata.name': ['string', typeof metadata.name],
          'metadata.orcid': ['string', typeof metadata.orcid],
          'metadata.paper_count': ['number', typeof metadata.paper_count]
        };
        
        Object.entries(typeChecks).forEach(([field, [expected, actual]]) => {
          if (actual !== expected) {
            report.warnings.push(`⚠️ ${field}: 期望 ${expected}，实际 ${actual}`);
          }
        });
        
        // 显示样本数据
        console.log('%c样本节点数据 (前3个):', 'color: #2196F3; font-weight: bold;');
        console.table(apiResponse.nodes.slice(0, 3).map(n => {
          const meta = n.metadata || {};
          return {
            ID: n.id?.substring(0, 20) || 'N/A',
            Label: n.label || 'N/A',
            Type: n.node_type || 'N/A',
            Name: meta.name || 'N/A',
            ORCID: meta.orcid?.substring(0, 30) || 'N/A',
            PaperCount: meta.paper_count
          };
        }));
      }
    }
    
    // 检查 edges
    if (!apiResponse.edges || !Array.isArray(apiResponse.edges)) {
      report.warnings.push('⚠️ 缺少 "edges" 字段或格式错误');
    } else {
      console.log(`✓ edges 字段存在，共 ${apiResponse.edges.length} 条`);
      
      if (apiResponse.edges.length > 0) {
        const firstEdge = apiResponse.edges[0];
        console.log('%c第一条边检查:', 'color: #FF9800; font-weight: bold;');
        
        ['source', 'target', 'weight'].forEach(field => {
          if (!(field in firstEdge)) {
            report.warnings.push(`⚠️ edges[0] 缺少字段: "${field}"`);
          } else {
            console.log(`  ✓ ${field}: ${firstEdge[field]}`);
          }
        });
      }
    }
    
    // 检查 metadata
    if (apiResponse.metadata) {
      console.log('✓ metadata 字段存在');
    } else {
      report.warnings.push('⚠️ 缺少 "metadata" 字段');
    }
  }
  
  // 生成报告
  console.log('%c=== 验证报告 ===', 'color: #1f77b4; font-weight: bold;');
  console.log(`状态: ${report.valid ? '✅ 有效' : '❌ 无效'}`);
  
  if (report.errors.length > 0) {
    console.log('%c错误 (' + report.errors.length + '):', 'color: #F44336; font-weight: bold;');
    report.errors.forEach(err => console.log('  ' + err));
  }
  
  if (report.warnings.length > 0) {
    console.log('%c警告 (' + report.warnings.length + '):', 'color: #FFC107; font-weight: bold;');
    report.warnings.forEach(warn => console.log('  ' + warn));
  }
  
  console.log('%c', 'color: reset;');
  return report;
};

window.$showExpectedFormats = function() {
  console.clear();
  console.log('%c=== 期望的数据格式 ===', 'color: #1f77b4; font-size: 16px; font-weight: bold;');
  
  console.log('%cAPI 原始格式 (从服务器返回):', 'color: #FF9800; font-weight: bold; font-size: 14px;');
  console.log(JSON.stringify(EXPECTED_API_STRUCTURE, null, 2));
  
  console.log('%c↓ 经过 transformCollaborationNodes 转换后 ↓', 'color: #4CAF50; font-weight: bold; font-size: 12px;');
  
  console.log('%c前端使用的格式:', 'color: #2196F3; font-weight: bold; font-size: 14px;');
  console.log(JSON.stringify(EXPECTED_FRONTEND_STRUCTURE, null, 2));
  
  console.log('%c关键转换点:', 'color: #F44336; font-weight: bold;');
  console.log('  • metadata.name (API) → name (前端)');
  console.log('  • metadata.orcid (API) → orcid (前端)');
  console.log('  • metadata.paper_count (API) → paperCount (前端)');
  console.log('  • 所有其他字段保持不变');
};

console.log('%c✅ API 验证工具已加载', 'color: #4CAF50; font-weight: bold;');
console.log('可用命令:');
console.log('  • $validateAPIResponse(data) - 验证 API 响应格式');
console.log('  • $showExpectedFormats() - 显示期望的数据格式');
