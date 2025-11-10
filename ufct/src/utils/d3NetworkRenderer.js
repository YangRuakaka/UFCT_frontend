/**
 * D3 力导向图渲染引擎
 * 处理图的渲染、交互和动画
 */

import * as d3 from 'd3';

export class D3NetworkRenderer {
  constructor(containerSelector, options = {}) {
    this.container = d3.select(containerSelector);
    this.options = {
      width: 1200,
      height: 700,
      nodeRadius: 6,
      linkDistance: 50,
      chargeStrength: -300,
      collideRadius: 8,
      enableLOD: true,              // 启用细节级别(Level of Detail)
      enableBatching: true,          // 启用批量更新
      enableCulling: true,           // 启用视锥剔除
      batchSize: 500,                // 批量更新的大小
      ...options
    };
    
    this.simulation = null;
    this.nodes = [];
    this.links = [];
    this.svg = null;
    this.g = null;
    this.highlightedNodes = new Set();
    this.highlightedLinks = new Set();
    this.selectedNode = null;
    this.nodeCache = new Map();      // 节点缓存
    this.linkCache = new Map();      // 链接缓存
    this.renderQueue = [];           // 待渲染队列
    this.isRendering = false;        // 正在渲染标志
    this.lastUpdateTime = 0;         // 上次更新时间
    this.performanceStats = {
      nodeCount: 0,
      linkCount: 0,
      renderTime: 0,
      fps: 60,
      culledNodes: 0
    };
  }

  /**
   * 初始化 SVG 和基础元素
   */
  initialize() {
    // 清空容器
    this.container.selectAll('*').remove();

    // 创建 SVG
    this.svg = this.container
      .append('svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('class', 'network-svg');

    // 添加背景
    this.svg
      .append('rect')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('fill', 'white')
      .on('click', () => this.deselectNode());

    // 添加缩放功能
    const zoom = d3.zoom().on('zoom', (event) => {
      this.g.attr('transform', event.transform);
    });

    this.svg.call(zoom);

    // 创建主图形组
    this.g = this.svg
      .append('g')
      .attr('class', 'network-container');

    // 添加链接层和节点层
    this.g.append('g').attr('class', 'links-layer');
    this.g.append('g').attr('class', 'nodes-layer');
  }

  /**
   * 绘制网络图 - 支持增量渲染和批量更新
   * @param {Array} nodes - 节点数组
   * @param {Array} links - 链接数组
   * @param {Object} styles - 样式配置
   */
  render(nodes, links, styles = {}) {
    const startTime = performance.now();
    this.nodes = nodes;
    this.links = links;

    // 优化仿真参数（基于节点数）
    const nodeCount = nodes.length;
    const isLargeGraph = nodeCount > 500;
    
    const simulationConfig = this.getOptimizedSimulationConfig(nodeCount);

    // 创建仿真
    this.simulation = d3
      .forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(simulationConfig.linkDistance)
        .strength(simulationConfig.linkStrength))
      .force('charge', d3.forceManyBody()
        .strength(simulationConfig.chargeStrength)
        .distanceMin(simulationConfig.distanceMin)
        .distanceMax(simulationConfig.distanceMax))
      .force('center', d3.forceCenter(
        this.options.width / 2,
        this.options.height / 2))
      .force('collision', d3.forceCollide()
        .radius(simulationConfig.collideRadius)
        .iterations(1));  // 减少碰撞迭代次数

    // 大图优化：减少仿真迭代次数
    if (isLargeGraph) {
      this.simulation.alphaDecay(0.05);  // 更快地冷却仿真
      this.simulation.velocityDecay(0.8);  // 增加速度衰减
    }

    // 使用批量更新替代一次性更新
    if (this.options.enableBatching && nodeCount > 300) {
      this.batchedUpdateLinks(links, styles);
      this.batchedUpdateNodes(nodes, styles);
    } else {
      this.updateLinks(links, styles);
      this.updateNodes(nodes, styles);
    }

    // 优化更新循环
    let tickCount = 0;
    this.simulation.on('tick', () => {
      tickCount++;
      // 只在特定间隔更新位置，减少重排次数
      if (tickCount % 2 === 0) {
        this.updateNodePositions();
        this.updateLinkPositions();
      }
    });

    // 记录性能指标
    this.performanceStats.nodeCount = nodeCount;
    this.performanceStats.linkCount = links.length;
    const endTime = performance.now();
    this.performanceStats.renderTime = Math.round(endTime - startTime);

    return this;
  }

  /**
   * 根据节点数获取优化的仿真配置
   * @private
   */
  getOptimizedSimulationConfig(nodeCount) {
    if (nodeCount < 100) {
      return {
        linkDistance: 60,
        linkStrength: 0.1,
        chargeStrength: -300,
        distanceMin: 1,
        distanceMax: 300,
        collideRadius: 8
      };
    } else if (nodeCount < 500) {
      return {
        linkDistance: 50,
        linkStrength: 0.08,
        chargeStrength: -200,
        distanceMin: 10,
        distanceMax: 250,
        collideRadius: 6
      };
    } else if (nodeCount < 1000) {
      return {
        linkDistance: 40,
        linkStrength: 0.05,
        chargeStrength: -100,
        distanceMin: 30,
        distanceMax: 200,
        collideRadius: 5
      };
    } else {
      return {
        linkDistance: 30,
        linkStrength: 0.03,
        chargeStrength: -50,
        distanceMin: 50,
        distanceMax: 150,
        collideRadius: 4
      };
    }
  }

  /**
   * 批量更新链接 - 分批处理以避免长时间锁定
   * @private
   */
  batchedUpdateLinks(links, styles) {
    const batch = (items, callback, size = this.options.batchSize) => {
      for (let i = 0; i < items.length; i += size) {
        const chunk = items.slice(i, i + size);
        requestAnimationFrame(() => callback(chunk));
      }
    };

    batch(links, (chunk) => {
      this.updateLinks(chunk, styles);
    });
  }

  /**
   * 批量更新节点 - 分批处理以避免长时间锁定
   * @private
   */
  batchedUpdateNodes(nodes, styles) {
    const batch = (items, callback, size = this.options.batchSize) => {
      for (let i = 0; i < items.length; i += size) {
        const chunk = items.slice(i, i + size);
        requestAnimationFrame(() => callback(chunk));
      }
    };

    batch(nodes, (chunk) => {
      this.updateNodes(chunk, styles);
    });
  }

  /**
   * 更新链接 - 支持增量更新
   */
  updateLinks(links, styles) {
    const linkSelection = this.g
      .select('.links-layer')
      .selectAll('line')
      .data(links, d => `${typeof d.source === 'object' ? d.source.id : d.source}-${typeof d.target === 'object' ? d.target.id : d.target}`);

    linkSelection.exit().remove();

    linkSelection
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => styles.linkColor?.(d) || '#999')
      .attr('stroke-width', d => styles.linkWidth?.(d) || 1)
      .attr('opacity', 0.4)  // 略微增加透明度以改善视觉效果
      .merge(linkSelection)
      .attr('stroke', d => styles.linkColor?.(d) || '#999')
      .attr('stroke-width', d => styles.linkWidth?.(d) || 1);
  }

  /**
   * 更新节点 - 支持增量更新和LOD
   */
  updateNodes(nodes, styles) {
    const isLargeGraph = nodes.length > 500;
    
    const nodeSelection = this.g
      .select('.nodes-layer')
      .selectAll('circle')
      .data(nodes, d => d.id);

    nodeSelection.exit().remove();

    const newNodes = nodeSelection
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', d => {
        const r = styles.nodeRadius?.(d) || this.options.nodeRadius;
        // 大图优化：减少节点大小以提高性能
        return isLargeGraph ? Math.max(r * 0.7, 2) : r;
      })
      .attr('fill', d => styles.nodeColor?.(d) || '#1f77b4')
      .attr('stroke', '#fff')
      .attr('stroke-width', isLargeGraph ? 0.5 : 2)
      .attr('cursor', 'pointer')
      .on('click', (event, d) => this.selectNode(d, event));
    
    // 大图时减少交互事件处理
    if (!isLargeGraph) {
      newNodes
        .on('mouseenter', (event, d) => this.highlightNode(d))
        .on('mouseleave', () => this.unhighlightNode())
        .call(d3.drag()
          .on('start', (event, d) => this.dragStarted(event, d))
          .on('drag', (event, d) => this.dragged(event, d))
          .on('end', (event, d) => this.dragEnded(event, d)));
    }

    // 添加标题提示
    newNodes.append('title')
      .text(d => `${d.id}\n${d.label || ''}`);

    nodeSelection.merge(newNodes)
      .attr('r', d => {
        const r = styles.nodeRadius?.(d) || this.options.nodeRadius;
        return isLargeGraph ? Math.max(r * 0.7, 2) : r;
      })
      .attr('fill', d => styles.nodeColor?.(d) || '#1f77b4')
      .attr('stroke-width', isLargeGraph ? 0.5 : 2);
  }

  /**
   * 更新节点位置
   */
  updateNodePositions() {
    this.g.selectAll('.node')
      .attr('cx', d => d.x)
      .attr('cy', d => d.y);
  }

  /**
   * 更新链接位置
   */
  updateLinkPositions() {
    this.g.selectAll('.link')
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
  }

  /**
   * 高亮节点及其连接
   */
  highlightNode(node) {
    this.highlightedNodes.clear();
    this.highlightedLinks.clear();

    // 添加节点本身
    this.highlightedNodes.add(node.id);

    // 添加相邻节点和边
    this.links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;

      if (sourceId === node.id) {
        this.highlightedNodes.add(targetId);
        this.highlightedLinks.add(`${sourceId}-${targetId}`);
      }
      if (targetId === node.id) {
        this.highlightedNodes.add(sourceId);
        this.highlightedLinks.add(`${sourceId}-${targetId}`);
      }
    });

    this.applyHighlight();
  }

  /**
   * 取消高亮
   */
  unhighlightNode() {
    this.highlightedNodes.clear();
    this.highlightedLinks.clear();
    this.applyHighlight();
  }

  /**
   * 应用高亮效果
   */
  applyHighlight() {
    this.g.selectAll('.node')
      .attr('opacity', d => this.highlightedNodes.has(d.id) ? 1 : 0.3)
      .attr('stroke-width', d => this.highlightedNodes.has(d.id) ? 3 : 2);

    this.g.selectAll('.link')
      .attr('opacity', d => {
        const linkId = `${d.source.id}-${d.target.id}`;
        return this.highlightedLinks.has(linkId) ? 1 : 0.1;
      })
      .attr('stroke-width', d => {
        const linkId = `${d.source.id}-${d.target.id}`;
        return this.highlightedLinks.has(linkId) ? 3 : 1;
      });
  }

  /**
   * 选择节点
   */
  selectNode(node, event) {
    event.stopPropagation();
    this.selectedNode = node;
    
    this.g.selectAll('.node')
      .attr('stroke-width', d => d.id === node.id ? 5 : 2)
      .attr('stroke', d => d.id === node.id ? '#ff0000' : '#fff');
  }

  /**
   * 取消选择节点
   */
  deselectNode() {
    this.selectedNode = null;
    
    this.g.selectAll('.node')
      .attr('stroke-width', 2)
      .attr('stroke', '#fff');
  }

  /**
   * 拖动开始
   */
  dragStarted(event, d) {
    if (!event.active) this.simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  /**
   * 拖动中
   */
  dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  /**
   * 拖动结束
   */
  dragEnded(event, d) {
    if (!event.active) this.simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  /**
   * 暂停仿真
   */
  pause() {
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  /**
   * 恢复仿真
   */
  resume() {
    if (this.simulation) {
      this.simulation.alpha(1).restart();
    }
  }

  /**
   * 清除
   */
  clear() {
    if (this.simulation) {
      this.simulation.stop();
    }
    this.container.selectAll('*').remove();
  }

  /**
   * 获取选中的节点
   */
  getSelectedNode() {
    return this.selectedNode;
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      simulationAlpha: this.simulation ? this.simulation.alpha() : 0
    };
  }

  /**
   * 设置容器尺寸
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
    
    if (this.svg) {
      this.svg.attr('width', width).attr('height', height);
    }
    
    if (this.simulation) {
      this.simulation.force('center', d3.forceCenter(width / 2, height / 2));
      this.simulation.alpha(0.3).restart();
    }
  }
}
