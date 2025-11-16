/**
 * 在浏览器控制台运行此脚本来快速诊断数据问题
 * 
 * 使用方式：
 * 1. 打开 Author Collaboration 页面
 * 2. 按 F12 打开开发者工具 → Console 标签
 * 3. 复制下面的代码并粘贴到控制台
 * 4. 按 Enter 执行
 */

console.clear();
console.log('%c=== 作者协作网络数据诊断工具 ===', 'color: #1f77b4; font-size: 16px; font-weight: bold;');

// 检查全局状态（如果使用 Vue 3 Composition API）
try {
  // 检查本地存储中的缓存数据
  const collaborationCache = localStorage.getItem('collaboration_network_cache');
  
  if (collaborationCache) {
    const cachedData = JSON.parse(collaborationCache);
    console.log('%c📦 本地缓存数据:', 'color: #4CAF50; font-weight: bold;');
    console.log('节点数:', cachedData.nodes?.length || 0);
    console.log('边数:', cachedData.links?.length || 0);
    
    if (cachedData.nodes?.length > 0) {
      console.log('%c第一个节点详情:', 'color: #2196F3; font-weight: bold;');
      const firstNode = cachedData.nodes[0];
      console.log(firstNode);
      
      console.log('%c节点字段列表:', 'color: #FF9800; font-weight: bold;');
      console.table({
        字段: Object.keys(firstNode),
        值: Object.values(firstNode)
      });
      
      // 检查关键字段
      console.log('%c关键字段检查:', 'color: #F44336; font-weight: bold;');
      const checks = {
        'id': !!firstNode.id,
        'label': !!firstNode.label,
        'collaborations': typeof firstNode.collaborations !== 'undefined',
        'papers': typeof firstNode.papers !== 'undefined',
        'hIndex': typeof firstNode.hIndex !== 'undefined'
      };
      console.table(checks);
      
      // 显示样本节点
      console.log('%c样本节点 (前3个):', 'color: #9C27B0; font-weight: bold;');
      console.table(cachedData.nodes.slice(0, 3).map(n => ({
        ID: n.id?.substring(0, 20),
        名称: n.label,
        协作数: n.collaborations,
        论文数: n.papers,
        H指数: n.hIndex
      })));
    }
  } else {
    console.warn('%c⚠️ 本地缓存中未找到数据', 'color: #FF5722; font-weight: bold;');
    console.log('请先在 Author Collaboration 页面加载数据');
  }
} catch (error) {
  console.error('❌ 诊断脚本出错:', error);
}

// 辅助函数：检查 Vue 组件状态（如果可访问）
window.$inspectAuthorCollaboration = function() {
  console.log('%c=== 检查 Vue 组件状态 ===', 'color: #1f77b4; font-size: 14px; font-weight: bold;');
  console.log('💡 提示：需要在 AuthorCollaboration 组件开发者中检查');
};

window.$analyzeNodeData = function(node) {
  if (!node) {
    console.log('%c请传入节点对象: $analyzeNodeData(nodeObject)', 'color: #FF9800;');
    return;
  }
  
  console.log('%c=== 节点数据分析 ===', 'color: #4CAF50; font-size: 14px; font-weight: bold;');
  console.log('节点ID:', node.id);
  console.log('节点名称:', node.label);
  console.log('所有字段:', Object.keys(node));
  console.log('完整对象:', node);
  
  console.log('%c数据有效性检查:', 'color: #2196F3; font-weight: bold;');
  console.table({
    字段: ['id', 'label', 'collaborations', 'papers', 'hIndex'],
    存在: [!!node.id, !!node.label, typeof node.collaborations !== 'undefined', typeof node.papers !== 'undefined', typeof node.hIndex !== 'undefined'],
    值: [node.id, node.label, node.collaborations, node.papers, node.hIndex]
  });
};

console.log('%c', 'color: reset;');
console.log('📝 可用的诊断命令:');
console.log('  • $analyzeNodeData(nodeObj) - 分析单个节点数据');
console.log('  • localStorage.getItem("collaboration_network_cache") - 查看完整缓存');
console.log('');
console.log('✅ 诊断工具加载完成');
