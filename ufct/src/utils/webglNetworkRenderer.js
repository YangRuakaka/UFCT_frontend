/**
 * WebGL 力导向图渲染引擎
 * 使用 force-graph 库和 Three.js，性能最优，支持超大规模网络
 */

import ForceGraph3D from 'force-graph';

export class WebGLNetworkRenderer {
  constructor(containerSelector, options = {}) {
    this.containerSelector = containerSelector;
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      throw new Error(`Container ${containerSelector} not found`);
    }

    this.options = {
      width: 1200,
      height: 700,
      nodeRadius: 6,
      linkDistance: 50,
      chargeStrength: -300,
      collideRadius: 8,
      ...options
    };

    this.graph = null;
    this.nodes = [];
    this.links = [];
    this.selectedNode = null;
    this.hoveredNode = null;
    this.highlightedNodes = new Set();
    this.highlightedLinks = new Set();

    this.styles = {};

    this.eventListeners = {
      nodeClick: null,
      nodeHover: null,
      nodeUnhover: null
    };

    this.performanceStats = {
      nodeCount: 0,
      linkCount: 0,
      renderTime: 0,
      fps: 60
    };

    this.isPaused = false;
  }

  /**
   * 初始化 WebGL 渲染器
   */
  initialize() {
    // 清空容器
    this.container.innerHTML = '';

    try {
      // 创建 force-graph 实例
      this.graph = ForceGraph3D()(this.container);
      
      // 设置尺寸
      this.graph.width(this.options.width);
      this.graph.height(this.options.height);

      // 配置节点和链接
      this.graph.nodeColor(node => this.getNodeColor(node));
      this.graph.nodeVal(node => this.getNodeSize(node));
      this.graph.linkColor(() => '#ccc');
      this.graph.linkWidth(link => this.getLinkWidth(link));
      
      // linkOpacity 可能不是标准方法，使用 linkOpacity 的替代方案
      if (typeof this.graph.linkOpacity === 'function') {
        this.graph.linkOpacity(0.4);
      } else if (this.graph.linkDirectionalParticles) {
        this.graph.linkDirectionalParticles(0);
      }

      // 事件监听
      this.graph.onNodeClick((node) => {
        this.selectNode(node);
        if (this.eventListeners.nodeClick) {
          this.eventListeners.nodeClick(node);
        }
      });

      this.graph.onNodeHover((node) => {
        this.hoveredNode = node;
        if (node) {
          this.container.style.cursor = 'pointer';
          // 悬停时更新节点大小以显示圆圈效果
          if (this.graph) {
            this.graph.nodeVal(n => this.getNodeSize(n));
          }
        } else {
          this.container.style.cursor = 'default';
          // 取消悬停时恢复节点大小
          if (this.graph) {
            this.graph.nodeVal(n => this.getNodeSize(n));
          }
        }
      });

      // 配置力导向图参数 - 优化节点分布
      if (this.graph.d3Force) {
        const linkForce = this.graph.d3Force('link');
        if (linkForce) {
          // 动态调整链接距离和强度：度数越高，距离越大，强度越强
          linkForce.distance(link => {
            const sourceDegree = (link.source.degree || 1);
            const targetDegree = (link.target.degree || 1);
            const avgDegree = (sourceDegree + targetDegree) / 2;
            // 基础距离乘以 1.3，度数越高距离越大（最多增加 100%）
            return this.options.linkDistance * 1.6 * (1 + avgDegree * 0.15);
          }).strength(link => {
            const sourceDegree = (link.source.degree || 1);
            const targetDegree = (link.target.degree || 1);
            const avgDegree = (sourceDegree + targetDegree) / 2;
            // 基础强度 0.6，度数越高强度越强（最多增加到 1.0）
            return 0.6 + Math.min(avgDegree * 0.06, 0.4);
          });
        }
        
        const chargeForce = this.graph.d3Force('charge');
        if (chargeForce) {
          // 动态调整电荷力：度数越高的节点排斥力越强
          chargeForce.strength(node => {
            const degree = node.degree || 1;
            // 增强排斥力，度数越高排斥力越强
            return this.options.chargeStrength * (1 + degree * 0.2);
          }).distanceMin(100).distanceMax(2000);
        }
        
        // 添加碰撞检测，防止节点重叠
        const collideForce = this.graph.d3Force('collision');
        if (!collideForce && this.graph.d3Force) {
          const d3Collide = require('d3-force').forceCollide;
          if (d3Collide) {
            this.graph.d3Force('collision', d3Collide().radius(d => (d.val || 20) * 1.2));
          }
        }
      }

    } catch (error) {
      console.error('Failed to initialize force-graph:', error);
      this.createFallbackCanvas();
    }
  }

  /**
   * 创建降级 canvas 版本
   */
  createFallbackCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.options.width;
    canvas.height = this.options.height;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';
    canvas.style.border = '1px solid #e0e0e0';
    canvas.style.background = 'white';
    this.container.appendChild(canvas);
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  /**
   * 绘制网络图
   */
  render(nodes, links, styles = {}) {
    const startTime = performance.now();

    this.nodes = nodes;
    this.links = links;
    this.styles = styles;

    // 计算每个节点的度数（连接数）
    const degreeCounts = {};
    nodes.forEach(node => {
      degreeCounts[node.id] = 0;
    });
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (degreeCounts[sourceId] !== undefined) degreeCounts[sourceId]++;
      if (degreeCounts[targetId] !== undefined) degreeCounts[targetId]++;
    });

    // 构建 force-graph 数据格式
    const graphData = {
      nodes: nodes.map(node => ({
        ...node,
        id: node.id || node.name,
        degree: degreeCounts[node.id] || 0
      })),
      links: links.map((link) => ({
        ...link,
        source: typeof link.source === 'object' ? link.source.id : link.source,
        target: typeof link.target === 'object' ? link.target.id : link.target
      }))
    };

    if (this.graph) {
      try {
        this.graph.graphData(graphData);

        // 优化大图的力导向参数
        const nodeCount = nodes.length;
        if (nodeCount > 1000) {
          const linkForce = this.graph.d3Force('link');
          if (linkForce) {
            linkForce.distance(this.options.linkDistance * 1.2).strength(0.6);
          }
          const chargeForce = this.graph.d3Force('charge');
          if (chargeForce) {
            chargeForce.strength(this.options.chargeStrength * 0.8);
          }
        }
        if (nodeCount > 5000) {
          const linkForce = this.graph.d3Force('link');
          if (linkForce) {
            linkForce.distance(this.options.linkDistance * 1.5).strength(0.5);
          }
          const chargeForce = this.graph.d3Force('charge');
          if (chargeForce) {
            chargeForce.strength(this.options.chargeStrength * 0.6);
          }
        }

        // 自动相机定位
        setTimeout(() => {
          if (this.graph && this.graph.zoomToFit) {
            this.graph.zoomToFit(400);
          }
        }, 1000);

      } catch (error) {
        console.error('Error rendering graph:', error);
      }
    } else if (this.canvas && this.ctx) {
      this.renderFallback(graphData);
    }

    this.performanceStats.nodeCount = nodes.length;
    this.performanceStats.linkCount = links.length;

    const endTime = performance.now();
    this.performanceStats.renderTime = Math.round(endTime - startTime);

    return this;
  }

  /**
   * 降级 Canvas 渲染
   */
  renderFallback(graphData) {
    // 简单的力导向布局（使用 d3 simulation）
    if (this.simulation) {
      this.simulation.stop();
    }

    const d3 = require('d3');
    this.simulation = d3
      .forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links)
        .id(d => d.id)
        .distance(this.options.linkDistance))
      .force('charge', d3.forceManyBody()
        .strength(this.options.chargeStrength))
      .force('center', d3.forceCenter(
        this.options.width / 2,
        this.options.height / 2))
      .force('collision', d3.forceCollide().radius(8));

    this.simulation.on('tick', () => {
      this.drawFallback(graphData);
    });
  }

  /**
   * 降级 Canvas 绘制
   */
  drawFallback(graphData) {
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.options.width, this.options.height);

    // 绘制链接
    graphData.links.forEach(link => {
      const source = link.source;
      const target = link.target;
      this.ctx.strokeStyle = '#ccc';
      this.ctx.lineWidth = 1;
      this.ctx.globalAlpha = 0.4;
      this.ctx.beginPath();
      this.ctx.moveTo(source.x, source.y);
      this.ctx.lineTo(target.x, target.y);
      this.ctx.stroke();
    });

    // 绘制节点
    graphData.nodes.forEach(node => {
      const radius = this.styles.nodeRadius?.(node) || this.options.nodeRadius;
      const color = this.styles.nodeColor?.(node) || '#1f77b4';

      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 1;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  /**
   * 获取节点颜色
   */
  getNodeColor(node) {
    // 始终使用自定义样式颜色（基于引用数量）
    return this.styles.nodeColor?.(node) || '#1f77b4';
  }

  /**
   * 获取节点大小
   */
  getNodeSize(node) {
    const baseSize = (this.styles.nodeRadius?.(node) || this.options.nodeRadius) * 2;
    // 悬停时增大节点，形成"选中圆圈"的视觉效果
    if (this.hoveredNode && this.hoveredNode.id === node.id) {
      return baseSize * 1.5;  // 增大50%
    }
    return baseSize;
  }

  /**
   * 获取链接宽度
   */
  getLinkWidth(link) {
    return this.styles.linkWidth?.(link) || 1;
  }

  /**
   * 高亮节点及其连接
   */
  highlightNode(node) {
    this.highlightedNodes.clear();
    this.highlightedLinks.clear();

    this.highlightedNodes.add(node.id);

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

    // 只更新链接颜色，不改变节点颜色
    if (this.graph) {
      this.graph.linkColor(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return this.highlightedLinks.has(`${sourceId}-${targetId}`) ? '#ff6b6b' : '#ccc';
      });
    }
  }

  /**
   * 取消高亮
   */
  unhighlightNode() {
    this.highlightedNodes.clear();
    this.highlightedLinks.clear();

    if (this.graph) {
      this.graph.linkColor(() => '#ccc');
    }
  }

  /**
   * 选择节点
   */
  selectNode(node) {
    this.selectedNode = node;
    // 不需要更新颜色，点击不改变节点颜色
    // 颜色始终由引用数量决定
  }

  /**
   * 取消选择节点
   */
  deselectNode() {
    this.selectedNode = null;
    // 不需要更新颜色，只是清除选中状态
  }

  /**
   * 暂停仿真
   */
  pause() {
    if (this.graph && this.graph.pauseAnimation) {
      this.graph.pauseAnimation();
    }
    if (this.simulation) {
      this.simulation.stop();
    }
    this.isPaused = true;
  }

  /**
   * 恢复仿真
   */
  resume() {
    if (this.graph && this.graph.resumeAnimation) {
      this.graph.resumeAnimation();
    }
    if (this.simulation) {
      this.simulation.alpha(1).restart();
    }
    this.isPaused = false;
  }

  /**
   * 重置缩放
   */
  resetZoom() {
    if (this.graph && this.graph.zoomToFit) {
      this.graph.zoomToFit(400);
    }
  }

  /**
   * 导出为图片
   */
  exportImage(filename = 'network.png') {
    let canvas = null;
    if (this.graph && this.graph.renderer?.domElement) {
      canvas = this.graph.renderer.domElement;
    } else if (this.canvas) {
      canvas = this.canvas;
    }

    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = filename;
      link.click();
    }
  }

  /**
   * 清除
   */
  clear() {
    if (this.graph) {
      this.graph.graphData({ nodes: [], links: [] });
    }
    if (this.simulation) {
      this.simulation.stop();
    }
    this.container.innerHTML = '';
    this.nodes = [];
    this.links = [];
    this.selectedNode = null;
    this.graph = null;
  }

  /**
   * 获取选中节点
   */
  getSelectedNode() {
    return this.selectedNode;
  }

  /**
   * 获取性能统计
   */
  getPerformanceStats() {
    return {
      ...this.performanceStats,
      simulationAlpha: this.graph ? 1 : 0
    };
  }

  /**
   * 设置容器尺寸
   */
  resize(width, height) {
    if (this.graph) {
      this.graph.width(width).height(height);
    }
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * 注册事件监听器
   */
  on(eventName, callback) {
    if (eventName === 'nodeClick') {
      this.eventListeners.nodeClick = callback;
    } else if (eventName === 'nodeHover') {
      this.eventListeners.nodeHover = callback;
    } else if (eventName === 'nodeUnhover') {
      this.eventListeners.nodeUnhover = callback;
    }
  }
}
