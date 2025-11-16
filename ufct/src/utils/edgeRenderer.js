/**
 * 边渲染增强模块 - 提供高级边可视化功能
 * 支持曲线边、箭头标记、边权重展示等
 */

import * as d3 from 'd3';

export class EdgeRenderer {
  constructor(svgSelection, options = {}) {
    this.svg = svgSelection;
    this.options = {
      enableArrows: true,
      enableCurvyLines: true,
      enableEdgeLabels: false,
      arrowSize: 8,
      ...options
    };
    
    this.defs = this.svg.append('defs');
    this.defineArrowMarkers();
  }

  /**
   * 定义箭头标记供边使用
   */
  defineArrowMarkers() {
    // 移除旧的标记
    this.defs.selectAll('marker').remove();

    // 定义不同颜色的箭头标记
    const colors = ['#999', '#FF6B6B', '#4ECDC4', '#45B7D1'];
    
    colors.forEach(color => {
      this.defs
        .append('marker')
        .attr('id', `arrow-${color.substring(1)}`)
        .attr('markerWidth', this.options.arrowSize)
        .attr('markerHeight', this.options.arrowSize)
        .attr('refX', this.options.arrowSize)
        .attr('refY', this.options.arrowSize / 2)
        .attr('orient', 'auto')
        .append('polygon')
        .attr('points', `0,0 ${this.options.arrowSize},${this.options.arrowSize / 2} 0,${this.options.arrowSize}`)
        .attr('fill', color);
    });

    // 定义渐变线条
    this.defs.selectAll('linearGradient').remove();
    const gradient = this.defs
      .append('linearGradient')
      .attr('id', 'edge-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#999').attr('stop-opacity', 0.3);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#999').attr('stop-opacity', 0.6);
  }

  /**
   * 渲染边 - 支持曲线和直线
   */
  renderEdges(edges, container) {
    const linkSelection = container
      .selectAll('.edge')
      .data(edges, d => `${this.getNodeId(d.source)}-${this.getNodeId(d.target)}`);

    linkSelection.exit().remove();

    const newEdges = linkSelection
      .enter()
      .append('g')
      .attr('class', 'edge-group');

    // 添加边线
    if (this.options.enableCurvyLines) {
      newEdges
        .append('path')
        .attr('class', 'edge edge-curve')
        .attr('fill', 'none')
        .attr('stroke', d => d.color || '#999')
        .attr('stroke-width', d => d.strokeWidth || 1)
        .attr('opacity', d => d.opacity !== undefined ? d.opacity : 0.4)
        .attr('marker-end', d => this.options.enableArrows && d.directed ? `url(#arrow-${(d.color || '#999').substring(1)})` : null);
    } else {
      newEdges
        .append('line')
        .attr('class', 'edge edge-line')
        .attr('stroke', d => d.color || '#999')
        .attr('stroke-width', d => d.strokeWidth || 1)
        .attr('opacity', d => d.opacity !== undefined ? d.opacity : 0.4)
        .attr('marker-end', d => this.options.enableArrows && d.directed ? `url(#arrow-${(d.color || '#999').substring(1)})` : null);
    }

    // 添加交互：悬停显示权重
    newEdges
      .on('mouseenter', function(event, d) {
        d3.select(this).style('opacity', 0.8).style('stroke-width', (d.strokeWidth || 1) * 2);
        
        // 显示权重提示
        if (d.weight) {
          const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'edge-tooltip')
            .style('position', 'fixed')
            .style('background', 'rgba(0,0,0,0.8)')
            .style('color', 'white')
            .style('padding', '4px 8px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .text(`权重: ${d.weight}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');

          d3.select(this).datum().tooltip = tooltip;
        }
      })
      .on('mousemove', function(event) {
        if (d3.select(this).datum().tooltip) {
          d3.select(this).datum().tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        }
      })
      .on('mouseleave', function() {
        d3.select(this).style('opacity', d => d.opacity !== undefined ? d.opacity : 0.4).style('stroke-width', d => d.strokeWidth || 1);
        if (d3.select(this).datum().tooltip) {
          d3.select(this).datum().tooltip.remove();
          d3.select(this).datum().tooltip = null;
        }
      });

    return { newEdges, existingEdges: linkSelection };
  }

  /**
   * 更新边的位置 - 支持曲线计算
   */
  updateEdgePositions(edgeGroup, nodes) {
    const self = this;

    if (this.options.enableCurvyLines) {
      // 曲线边：使用二次贝塞尔曲线
      edgeGroup.selectAll('.edge-curve').attr('d', function(d) {
        const source = nodes.find(n => n.id === self.getNodeId(d.source));
        const target = nodes.find(n => n.id === self.getNodeId(d.target));
        
        if (!source || !target) return '';

        // 计算中点用于曲线控制
        const mx = (source.x + target.x) / 2;
        const my = (source.y + target.y) / 2;
        
        // 计算垂直偏移以创建曲线
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const curveHeight = distance * 0.1 * (d.curvature || 0.1);
        
        // 垂直方向
        const px = -dy / distance * curveHeight;
        const py = dx / distance * curveHeight;

        return `M ${source.x} ${source.y} Q ${mx + px} ${my + py} ${target.x} ${target.y}`;
      });
    } else {
      // 直线边
      edgeGroup.selectAll('.edge-line')
        .attr('x1', d => {
          const source = nodes.find(n => n.id === self.getNodeId(d.source));
          return source ? source.x : 0;
        })
        .attr('y1', d => {
          const source = nodes.find(n => n.id === self.getNodeId(d.source));
          return source ? source.y : 0;
        })
        .attr('x2', d => {
          const target = nodes.find(n => n.id === self.getNodeId(d.target));
          return target ? target.x : 0;
        })
        .attr('y2', d => {
          const target = nodes.find(n => n.id === self.getNodeId(d.target));
          return target ? target.y : 0;
        });
    }
  }

  /**
   * 获取节点ID（处理对象引用）
   */
  getNodeId(node) {
    return typeof node === 'object' ? node.id : node;
  }

  /**
   * 高亮指定的边
   */
  highlightEdge(edgeGroup, sourceId, targetId, highlight = true) {
    edgeGroup.selectAll('.edge-group').style('opacity', highlight ? 0.2 : 1);
    
    edgeGroup
      .selectAll('.edge-group')
      .filter(d => {
        const s = this.getNodeId(d.source);
        const t = this.getNodeId(d.target);
        return (s === sourceId && t === targetId) || (s === targetId && t === sourceId);
      })
      .style('opacity', 1)
      .selectAll('.edge-curve, .edge-line')
      .attr('stroke-width', d => (d.strokeWidth || 1) * 3);
  }

  /**
   * 重置边的高亮
   */
  resetHighlight(edgeGroup) {
    edgeGroup.selectAll('.edge-group').style('opacity', 1);
    edgeGroup
      .selectAll('.edge-curve, .edge-line')
      .attr('stroke-width', d => d.strokeWidth || 1);
  }
}

/**
 * 曲线边计算工具
 */
export const EdgeCurveCalculator = {
  /**
   * 计算二次贝塞尔曲线路径
   */
  quadraticBezier(source, target, curveHeight = 0.15) {
    const mx = (source.x + target.x) / 2;
    const my = (source.y + target.y) / 2;
    
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return `M ${source.x} ${source.y}`;
    
    const ch = distance * curveHeight;
    const px = -dy / distance * ch;
    const py = dx / distance * ch;

    return `M ${source.x} ${source.y} Q ${mx + px} ${my + py} ${target.x} ${target.y}`;
  },

  /**
   * 计算三次贝塞尔曲线路径
   */
  cubicBezier(source, target, controlPoint1, controlPoint2) {
    return `M ${source.x} ${source.y} C ${controlPoint1.x} ${controlPoint1.y} ${controlPoint2.x} ${controlPoint2.y} ${target.x} ${target.y}`;
  }
};
