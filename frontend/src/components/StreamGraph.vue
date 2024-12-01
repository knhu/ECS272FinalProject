<template>
  <div>
    <!-- Season Filter -->
    <label for="season-select">Select Season:</label>
    <select id="season-select" v-model="selectedSeason" @change="updateChart">
      <option v-for="season in seasons" :key="season" :value="season">{{ season }}</option>
    </select>

    <!-- Metric Filter -->
    <label for="metric-select">Choose Metric:</label>
    <select id="metric-select" v-model="selectedMetric" @change="updateChart">
      <option v-for="metric in metrics" :key="metric" :value="metric">{{ metric }}</option>
    </select>

    <!-- Stream Graph Container -->
    <div ref="chart" style="border: 1px solid lightgray; height: 400px;"></div>

    <!-- Tooltip -->
    <div ref="tooltip" style="position: absolute; pointer-events: none; background: white; padding: 8px; border: 1px solid gray; border-radius: 4px; opacity: 0;"></div>
  </div>
</template>

<script>
import * as d3 from 'd3';

export default {
  props: ['data'],
  data() {
    return {
      selectedSeason: null, // Selected season
      selectedMetric: null, // Selected metric
      metrics: [], // Available metrics
      seasons: [], // Available seasons
      colors: d3.schemeCategory10, // Color scheme
    };
  },
  watch: {
    data: 'initializeFilters', // Initialize filters when data changes
  },
  mounted() {
    this.createChart();
    this.initializeFilters();
  },
  methods: {
    initializeFilters() {
      // Filter metrics and seasons from the data
      const allMetrics = Object.keys(this.data[0] || {}).filter(
        (key) =>
          ![
            'team',
            'player_id',
            'player_name',
            'position',
            'season',
            'game_type',
            'week',
            'college',
          ].includes(key)
      );

      this.metrics = allMetrics;
      this.selectedMetric = this.metrics[0]; // Default to the first metric

      const allSeasons = [...new Set(this.data.map((d) => d.season))];
      this.seasons = allSeasons.sort();
      this.selectedSeason = this.seasons[0]; // Default to the first season

      this.updateChart();
    },
    createChart() {
      const svg = d3
        .select(this.$refs.chart)
        .append('svg')
        .attr('width', 800)
        .attr('height', 400)
        .append('g')
        .attr('transform', 'translate(50,20)');

      this.svg = svg;
    },
    updateChart() {
  const { data, selectedMetric, selectedSeason, colors } = this;

  // Filter data for the selected season
  const filteredData = data.filter((d) => d.season === selectedSeason);

  // Group data by week and position
  const groupedData = d3.group(filteredData, (d) => d.week, (d) => d.position);

  const weeks = [...groupedData.keys()].sort((a, b) => +a - +b);
  const positions = Array.from(new Set(filteredData.map((d) => d.position)));

  // Custom order by average contribution
  const positionAverages = positions.map((position) => ({
    position,
    average: d3.mean(filteredData.filter((d) => d.position === position), (d) => +d[selectedMetric] || 0),
  }));

  positionAverages.sort((a, b) => b.average - a.average); // Largest averages on the bottom
  const sortedPositions = positionAverages.map((d) => d.position);

  // Configure stack layout
  const stackedData = d3
    .stack()
    .keys(sortedPositions)
    .value((week, position) => {
      const players = week[1].get(position) || [];
      return d3.mean(players, (d) => +d[selectedMetric] || 0); // Use average
    })
    .order(d3.stackOrderNone) // Custom ordering
    .offset(d3.stackOffsetWiggle)(weeks.map((week) => [week, groupedData.get(week)]));

  // Clear previous chart
  this.svg.selectAll('*').remove();

  // Scales
  const x = d3.scaleLinear().domain([0, d3.max(weeks, (d) => +d)]).range([0, 700]);
  const y = d3
    .scaleLinear()
    .domain([
      d3.min(stackedData, (layer) => d3.min(layer, (d) => d[0])),
      d3.max(stackedData, (layer) => d3.max(layer, (d) => d[1])),
    ])
    .range([350, 0]);

  const color = d3.scaleOrdinal().domain(positions).range(colors);

  // Axes
  this.svg
    .append('g')
    .attr('transform', 'translate(0,350)')
    .call(d3.axisBottom(x).ticks(weeks.length));
  this.svg.append('g').call(d3.axisLeft(y));

  // Tooltip setup
  const tooltip = d3.select(this.$refs.tooltip);

  // Stream graph paths
  this.svg
    .selectAll('path')
    .data(stackedData)
    .join('path')
    .attr('fill', (d) => color(d.key))
    .style('opacity', 0.8)
    .attr(
      'd',
      d3
        .area()
        .x((d, i) => x(weeks[i]))
        .y0((d) => y(d[0]))
        .y1((d) => y(d[1]))
        .curve(d3.curveCatmullRom)
    )
    .on('mouseover', function () {
      tooltip.style('opacity', 1).style('pointer-events', 'none');
      d3.select(this).style('stroke', '#000').style('stroke-width', 1.5); // Highlight on hover
    })
    .on('mousemove', function (event, d) {
      const [xPos] = d3.pointer(event);

      const weekIndex = Math.round(x.invert(xPos));
      const weekData = d[weekIndex]; // Get the week's data from the stream

      tooltip
        .html(
          `<strong>Position:</strong> ${d.key}<br />
          <strong>Week:</strong> ${weekIndex}<br />
          <strong>${selectedMetric}:</strong> ${(weekData[1] - weekData[0]).toFixed(2)}`
        )
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 28}px`);
    })
    .on('mouseout', function () {
      tooltip.style('opacity', 0);
      d3.select(this).style('stroke', null).style('stroke-width', null); // Reset highlight
    })
    .on('click', (event, d) => {
      console.log(`Clicked on position: ${d.key}`);
      this.$emit('filter-position', d.key); // Emit event to parent
    });

  // Legend
  const legend = this.svg
    .selectAll('.legend')
    .data(sortedPositions)
    .join('g')
    .attr('transform', (d, i) => `translate(10,${i * 20})`);

  legend
    .append('rect')
    .attr('x', 700)
    .attr('y', 5)
    .attr('width', 10)
    .attr('height', 10)
    .attr('fill', (d) => color(d));

  legend
    .append('text')
    .attr('x', 715)
    .attr('y', 15)
    .attr('text-anchor', 'start')
    .text((d) => d);
    },
  },
};

</script>

<style scoped>
/* Add styles as needed */
</style>
