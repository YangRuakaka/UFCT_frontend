/**
 * Citation Histogram Component - D3.js Histogram
 * Shows the distribution of citation counts across papers
 */

<template>
  <div class="histogram-container" ref="chartContainer">
    <svg :id="`histogram-${componentId}`" class="histogram-svg"></svg>
    <div class="chart-info">
      <div class="info-stat">
        <span class="stat-label">Total Papers:</span>
        <span class="stat-value">{{ totalPapers }}</span>
      </div>
      <div class="info-stat">
        <span class="stat-label">Avg Citations/Paper:</span>
        <span class="stat-value">{{ averageCitationCount.toFixed(2) }}</span>
      </div>
      <div class="info-stat">
        <span class="stat-label">Max Citations:</span>
        <span class="stat-value">{{ maxCitationCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, computed } from 'vue';
import * as d3 from 'd3';

export default {
  name: 'CitationHistogram',
  props: {
    data: {
      type: Array,
      required: true,
      default: () => []
    },
    selectedYear: {
      type: Number,
      default: null
    },
    title: {
      type: String,
      default: 'Citation Count Distribution'
    }
  },
  setup(props) {
    const chartContainer = ref(null);
    const componentId = computed(() => Math.random().toString(36).substr(2, 9));
    
    let svgElement = null;
    let xScale = null;
    let yScale = null;
    let chart = null;

    const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };
    const ANIMATION_DURATION = 300;
    const COLORS = ['#3498db', '#2ecc71', '#f39c12', '#e74c3c', '#9b59b6'];

    /**
     * Calculate statistics from histogram data
     */
    const totalPapers = computed(() => {
      if (!props.data || props.data.length === 0) return 0;
      return props.data.reduce((sum, bin) => sum + bin.count, 0);
    });

    const averageCitationCount = computed(() => {
      if (totalPapers.value === 0) return 0;
      if (!props.data || props.data.length === 0) return 0;
      
      let totalCitations = 0;
      props.data.forEach(bin => {
        // 使用区间中点作为估计值
        const midPoint = (bin.bin_start + bin.bin_end) / 2;
        totalCitations += midPoint * bin.count;
      });
      return totalCitations / totalPapers.value;
    });

    const maxCitationCount = computed(() => {
      if (!props.data || props.data.length === 0) return 0;
      // 返回最后一个区间的上界
      const lastBin = props.data[props.data.length - 1];
      return lastBin.bin_end === Infinity ? '100+' : lastBin.bin_end;
    });

    /**
     * Initialize or update the chart
     */
    const renderChart = () => {
      if (!props.data || props.data.length === 0) {
        console.log('No histogram data available');
        return;
      }

      // Get container dimensions
      const container = chartContainer.value;
      if (!container) return;

      const width = container.clientWidth - MARGIN.left - MARGIN.right;
      const height = container.clientHeight - 100 - MARGIN.top - MARGIN.bottom;

      if (width <= 0 || height <= 0) {
        console.warn('Invalid chart dimensions');
        return;
      }

      // Clear previous chart
      if (svgElement) {
        d3.select(svgElement).selectAll('*').remove();
      }

      // Create SVG
      const svg = d3.select(chartContainer.value).select('svg');
      svg.attr('width', width + MARGIN.left + MARGIN.right)
         .attr('height', height + MARGIN.top + MARGIN.bottom);

      // Create main group
      chart = svg.selectAll('g.chart-group').data([null]);
      chart.enter()
        .append('g')
        .attr('class', 'chart-group')
        .merge(chart)
        .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

      chart = svg.select('g.chart-group');
      svgElement = svg.node();

      // Create scales
      xScale = d3.scaleBand()
        .domain(props.data.map((d, i) => i))
        .range([0, width])
        .padding(0.3);

      yScale = d3.scaleLinear()
        .domain([0, d3.max(props.data, d => d.count)])
        .range([height, 0]);

      // Render bars
      const bars = chart.selectAll('.bar').data(props.data, (d, i) => i);

      bars.exit().remove();

      bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d, i) => xScale(i))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.count))
        .attr('height', d => height - yScale(d.count))
        .style('fill', (d, i) => COLORS[i % COLORS.length])
        // eslint-disable-next-line no-unused-vars
        .on('mouseenter', function(event, d) {
          d3.select(this)
            .transition()
            .duration(150)
            .style('opacity', 0.8);
        })
        // eslint-disable-next-line no-unused-vars
        .on('mouseleave', function(event, d) {
          d3.select(this)
            .transition()
            .duration(150)
            .style('opacity', 1);
        })
        .merge(bars)
        .transition()
        .duration(ANIMATION_DURATION)
        .attr('x', (d, i) => xScale(i))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.count))
        .attr('height', d => height - yScale(d.count));

      // Add value labels on bars
      const labels = chart.selectAll('.bar-label').data(props.data, (d, i) => i);

      labels.exit().remove();

      labels.enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('text-anchor', 'middle')
        .attr('x', (d, i) => xScale(i) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.count) - 5)
        .text(d => d.count)
        .merge(labels)
        .transition()
        .duration(ANIMATION_DURATION)
        .attr('x', (d, i) => xScale(i) + xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.count) - 5)
        .text(d => d.count);

      // Add tooltips
      const tooltips = chart.selectAll('title').data(props.data, (d, i) => i);
      tooltips.exit().remove();
      
      tooltips.enter()
        .append('title')
        .merge(tooltips)
        .text(d => `Range: ${d.bin_range}\nCount: ${d.count}\nPercentage: ${d.percentage.toFixed(1)}%`);

      // Render X axis
      const xAxisGroup = chart.selectAll('.x-axis').data([null]);
      xAxisGroup.enter()
        .append('g')
        .attr('class', 'x-axis axis')
        .attr('transform', `translate(0,${height})`)
        .merge(xAxisGroup)
        .call(
          d3.axisBottom(xScale)
            .tickFormat((d, i) => props.data[i]?.bin_range || '')
        );

      // Rotate X axis labels
      chart.selectAll('.x-axis text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .style('font-size', '12px');

      // Add X axis label
      const xLabelGroup = chart.selectAll('.x-label').data([null]);
      xLabelGroup.enter()
        .append('text')
        .attr('class', 'x-label')
        .attr('x', width / 2)
        .attr('y', height + 45)
        .attr('text-anchor', 'middle')
        .merge(xLabelGroup)
        .text('Citation Count Range');

      // Render Y axis
      const yAxisGroup = chart.selectAll('.y-axis').data([null]);
      yAxisGroup.enter()
        .append('g')
        .attr('class', 'y-axis axis')
        .merge(yAxisGroup)
        .call(d3.axisLeft(yScale));

      // Add Y axis label
      const yLabelGroup = chart.selectAll('.y-label').data([null]);
      yLabelGroup.enter()
        .append('text')
        .attr('class', 'y-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - 50)
        .attr('x', 0 - height / 2)
        .attr('text-anchor', 'middle')
        .merge(yLabelGroup)
        .text('Number of Papers');

      // Add grid lines
      const gridGroup = chart.selectAll('.grid-group').data([null]);
      gridGroup.enter()
        .append('g')
        .attr('class', 'grid-group')
        .merge(gridGroup)
        .call(
          d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat('')
            .tickSizeOuter(0)
        );

      console.log('✓ Citation Histogram chart rendered:', {
        bins: props.data.length,
        totalPapers: totalPapers.value,
        selectedYear: props.selectedYear
      });
    };

    /**
     * Watch for data changes
     */
    watch(
      () => props.data,
      () => {
        renderChart();
      },
      { deep: true }
    );

    /**
     * Mount and initial render
     */
    onMounted(() => {
      console.log('📌 CitationHistogram component mounted');
      renderChart();

      // Handle window resize
      const handleResize = () => {
        renderChart();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });

    return {
      chartContainer,
      componentId,
      totalPapers,
      averageCitationCount,
      maxCitationCount
    };
  }
};
</script>

<style scoped>
.histogram-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: white;
}

.histogram-svg {
  flex: 1;
  width: 100%;
  height: 100%;
  display: block;
  min-height: 300px;
}

/* D3 styles */
::v-deep(.histogram-svg) {
  .bar {
    stroke: none;
    cursor: pointer;
    transition: opacity 0.2s ease;
    opacity: 1;
  }

  .bar:hover {
    opacity: 0.8;
  }

  .bar-label {
    font-size: 12px;
    font-weight: 600;
    fill: #333;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    pointer-events: none;
  }

  .axis {
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .grid-group {
    stroke: #e0e0e0;
    stroke-dasharray: 4;
    opacity: 0.5;
    pointer-events: none;
  }

  .x-label,
  .y-label {
    font-size: 14px;
    font-weight: 600;
    fill: #2c3e50;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
}

.chart-info {
  display: flex;
  gap: 30px;
  padding: 15px 0;
  justify-content: center;
  border-top: 1px solid #f0f0f0;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.info-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  color: #666;
  font-weight: 500;
}

.stat-value {
  color: #2c3e50;
  font-weight: 700;
  font-size: 1.05rem;
}
</style>
