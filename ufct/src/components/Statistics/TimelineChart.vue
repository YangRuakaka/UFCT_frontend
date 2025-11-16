/**
 * Timeline Chart Component - D3.js Bar Chart
 * Shows the number of CS papers and their citation distribution over years
 * Interactive: Click on a bar to select that year
 */

<template>
  <div class="timeline-chart-container" ref="chartContainer">
    <svg :id="`timeline-${componentId}`" class="timeline-svg"></svg>
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-color normal"></span>
        <span class="legend-label">Papers</span>
      </div>
      <div class="legend-item">
        <span class="legend-color selected"></span>
        <span class="legend-label">Selected Year</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, computed } from 'vue';
import * as d3 from 'd3';

export default {
  name: 'TimelineChart',
  props: {
    data: {
      type: Array,
      required: true,
      default: () => []
    },
    selectedYear: {
      type: Number,
      default: null
    }
  },
  emits: ['year-selected'],
  setup(props, { emit }) {
    const chartContainer = ref(null);
    const componentId = computed(() => Math.random().toString(36).substr(2, 9));
    
    let svgElement = null;
    let xScale = null;
    let yScale = null;
    let chart = null;

    const MARGIN = { top: 20, right: 30, bottom: 40, left: 60 };
    const ANIMATION_DURATION = 300;

    /**
     * Initialize or update the chart
     */
    const renderChart = () => {
      if (!props.data || props.data.length === 0) {
        console.log('No timeline data available');
        return;
      }

      // Get container dimensions
      const container = chartContainer.value;
      if (!container) return;

      const width = container.clientWidth - MARGIN.left - MARGIN.right;
      const height = container.clientHeight - MARGIN.top - MARGIN.bottom;

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
        .domain(props.data.map(d => d.year))
        .range([0, width])
        .padding(0.4);

      yScale = d3.scaleLinear()
        .domain([0, d3.max(props.data, d => d.paperCount)])
        .range([height, 0]);

      // Render bars
      const bars = chart.selectAll('.bar').data(props.data, d => d.year);

      bars.exit().remove();

      bars.enter()
        .append('rect')
        .attr('class', d => `bar ${d.year === props.selectedYear ? 'selected' : ''}`)
        .attr('x', d => xScale(d.year))
        .attr('width', xScale.bandwidth())
        .attr('y', d => yScale(d.paperCount))
        .attr('height', d => height - yScale(d.paperCount))
        .on('click', (event, d) => {
          event.stopPropagation();
          emit('year-selected', d.year);
        })
        // eslint-disable-next-line no-unused-vars
        .on('mouseenter', function(event, d) {
          if (d.year !== props.selectedYear) {
            d3.select(this).classed('hover', true);
          }
        })
        // eslint-disable-next-line no-unused-vars
        .on('mouseleave', function(event, d) {
          d3.select(this).classed('hover', false);
        })
        .merge(bars)
        .transition()
        .duration(ANIMATION_DURATION)
        .attr('x', d => xScale(d.year))
        .attr('y', d => yScale(d.paperCount))
        .attr('height', d => height - yScale(d.paperCount))
        .attr('class', d => `bar ${d.year === props.selectedYear ? 'selected' : ''}`);

      bars.append('title')
        .text(d => `${d.year}: ${d.paperCount} papers`);

      // Render X axis
      const xAxisGroup = chart.selectAll('.x-axis').data([null]);
      xAxisGroup.enter()
        .append('g')
        .attr('class', 'x-axis axis')
        .attr('transform', `translate(0,${height})`)
        .merge(xAxisGroup)
        .call(d3.axisBottom(xScale));

      // Add X axis label
      const xLabelGroup = chart.selectAll('.x-label').data([null]);
      xLabelGroup.enter()
        .append('text')
        .attr('class', 'x-label')
        .attr('x', width / 2)
        .attr('y', height + 35)
        .attr('text-anchor', 'middle')
        .merge(xLabelGroup)
        .text('Year');

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

      console.log('✓ Timeline chart rendered:', {
        dataPoints: props.data.length,
        selectedYear: props.selectedYear
      });
    };

    /**
     * Update selected year styling
     */
    const updateSelectedYear = () => {
      if (!svgElement) return;

      d3.select(svgElement)
        .selectAll('rect.bar')
        .transition()
        .duration(ANIMATION_DURATION)
        .attr('class', d => `bar ${d.year === props.selectedYear ? 'selected' : ''}`);

      console.log('Selected year updated:', props.selectedYear);
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
     * Watch for selected year changes
     */
    watch(
      () => props.selectedYear,
      () => {
        updateSelectedYear();
      }
    );

    /**
     * Mount and initial render
     */
    onMounted(() => {
      console.log('📌 TimelineChart component mounted');
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
      componentId
    };
  }
};
</script>

<style scoped>
.timeline-chart-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: white;
}

.timeline-svg {
  flex: 1;
  width: 100%;
  height: 100%;
  display: block;
  min-height: 300px;
}

/* D3 styles */
::v-deep(.timeline-svg) {
  .bar {
    fill: #3498db;
    stroke: #2980b9;
    stroke-width: 1px;
    cursor: pointer;
    transition: fill 0.2s ease;
  }

  .bar:hover {
    fill: #5dade2;
  }

  .bar.hover {
    fill: #5dade2;
  }

  .bar.selected {
    fill: #27ae60;
    stroke: #229954;
    stroke-width: 2px;
  }

  .axis {
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }

  .axis-label {
    font-size: 14px;
    font-weight: 600;
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

.chart-legend {
  display: flex;
  gap: 20px;
  padding: 10px 0;
  justify-content: center;
  border-top: 1px solid #f0f0f0;
  font-size: 0.85rem;
  color: #666;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 2px;
  border: 1px solid #999;
}

.legend-color.normal {
  background: #3498db;
  border-color: #2980b9;
}

.legend-color.selected {
  background: #27ae60;
  border-color: #229954;
}
</style>
