/**
 * 网络图优化配置预设
 * 可根据实际数据规模选择合适的配置
 */

export const OPTIMIZATION_PRESETS = {
  /**
   * 小数据集预设 (< 500 节点)
   * 完整展示，不做优化
   */
  SMALL: {
    name: '小数据集',
    enableOptimization: false,
    enableLOD: false,
    maxRenderNodes: 500,
    optimizationThreshold: 1,
    preserveTopPercent: 1.0,
    enableCommunityMerge: false,
    enableBatching: false,
    batchSize: 500,
    description: '完整展示所有节点和链接'
  },

  /**
   * 中等数据集预设 (500 - 2000 节点)
   * 平衡性能和展示效果
   */
  MEDIUM: {
    name: '中等数据集',
    enableOptimization: true,
    enableLOD: true,
    maxRenderNodes: 1500,
    optimizationThreshold: 2,
    preserveTopPercent: 0.15,
    enableCommunityMerge: false,
    enableBatching: true,
    batchSize: 500,
    description: '平衡性能和展示，保留关键节点'
  },

  /**
   * 大数据集预设 (2000 - 5000 节点)
   * 强度优化，保证流畅性
   */
  LARGE: {
    name: '大数据集',
    enableOptimization: true,
    enableLOD: true,
    maxRenderNodes: 1500,
    optimizationThreshold: 3,
    preserveTopPercent: 0.12,
    enableCommunityMerge: true,
    enableBatching: true,
    batchSize: 500,
    description: '高度优化，展示最重要的连接'
  },

  /**
   * 超大数据集预设 (> 5000 节点)
   * 极度优化，确保可用性
   */
  XLARGE: {
    name: '超大数据集',
    enableOptimization: true,
    enableLOD: true,
    maxRenderNodes: 1200,
    optimizationThreshold: 4,
    preserveTopPercent: 0.1,
    enableCommunityMerge: true,
    enableBatching: true,
    batchSize: 300,
    description: '极度优化，仅展示最核心的节点'
  },

  /**
   * 自定义配置模板
   */
  CUSTOM: {
    name: '自定义',
    enableOptimization: true,
    enableLOD: true,
    maxRenderNodes: 1500,
    optimizationThreshold: 2,
    preserveTopPercent: 0.15,
    enableCommunityMerge: false,
    enableBatching: true,
    batchSize: 500,
    description: '根据需要调整参数'
  }
};

/**
 * 根据节点数选择合适的预设
 * @param {number} nodeCount - 节点数量
 * @returns {Object} 推荐的预设配置
 */
export function selectOptimalPreset(nodeCount) {
  if (nodeCount <= 500) {
    return OPTIMIZATION_PRESETS.SMALL;
  } else if (nodeCount <= 2000) {
    return OPTIMIZATION_PRESETS.MEDIUM;
  } else if (nodeCount <= 5000) {
    return OPTIMIZATION_PRESETS.LARGE;
  } else {
    return OPTIMIZATION_PRESETS.XLARGE;
  }
}

/**
 * 应用预设配置到组件
 * @param {Object} component - Vue 组件实例
 * @param {string} presetName - 预设名称
 */
export function applyPreset(component, presetName = 'MEDIUM') {
  const preset = OPTIMIZATION_PRESETS[presetName];
  if (!preset) {
    console.warn(`预设 ${presetName} 不存在，使用默认配置`);
    return;
  }

  Object.assign(component, {
    enableOptimization: preset.enableOptimization,
    optimizationThreshold: preset.optimizationThreshold,
    maxRenderNodes: preset.maxRenderNodes,
    // ... 其他配置
  });
}

/**
 * 性能建议生成器
 * @param {Object} stats - 性能统计
 * @returns {string[]} 建议列表
 */
export function generatePerformanceRecommendations(stats) {
  const recommendations = [];

  // 检查 FPS
  if (stats.fps < 30) {
    recommendations.push('⚠️ FPS 过低，建议提高优化级别或使用 Worker 处理数据');
  } else if (stats.fps < 45) {
    recommendations.push('💡 FPS 仍有提升空间，可考虑增加优化阈值');
  }

  // 检查渲染时间
  if (stats.renderTime > 200) {
    recommendations.push('⚠️ 渲染时间过长，建议减少节点数量');
  }

  // 检查内存占用
  if (stats.memory > 500) {
    recommendations.push('⚠️ 内存占用较高，监控 GC 行为');
  }

  // 检查压缩率
  if (stats.compressionRate > 80) {
    recommendations.push('💡 节点压缩率较高，可能丢失一些细节，需要权衡');
  } else if (stats.compressionRate < 20 && stats.nodeCount > 1000) {
    recommendations.push('💡 压缩率较低，有进一步优化空间');
  }

  // 检查优化级别
  if (stats.optimizationLevel === 'heavy' && stats.compressionRate > 85) {
    recommendations.push('⚠️ 优化过度，可能丢失关键结构信息');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ 性能良好！');
  }

  return recommendations;
}

/**
 * 调试模式配置
 * 用于性能分析和问题诊断
 */
export const DEBUG_PRESET = {
  name: '调试模式',
  enableOptimization: true,
  enableLOD: false,  // 禁用 LOD 以查看完整效果
  maxRenderNodes: 2000,
  optimizationThreshold: 1,
  preserveTopPercent: 0.2,
  enableCommunityMerge: false,
  enableBatching: false,  // 禁用批处理以便调试
  batchSize: 500,
  description: '用于调试和分析，启用所有功能但不进行 LOD'
};

export default {
  OPTIMIZATION_PRESETS,
  selectOptimalPreset,
  applyPreset,
  generatePerformanceRecommendations,
  DEBUG_PRESET
};
