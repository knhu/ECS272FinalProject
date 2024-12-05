import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface PlayerData {
  position: string;
  fantasy_points_ppr: number;
}

interface DensityData {
  key: string;
  density: [number, number][];
}

interface RidgelinePlotProps {
  onSelectPosition: (position: string) => void;
}

const RidgelinePlot: React.FC<RidgelinePlotProps> = ({ onSelectPosition }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
  const margin = { top: 60, right: 30, bottom: 50, left: 110 };
  const width = 800 - margin.left - margin.right;
  const height = 600 - margin.top - margin.bottom;

  // Clear previous SVG content
  d3.select(svgRef.current).selectAll('*').remove();

  const svg = d3
    .select(svgRef.current)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  d3.csv<PlayerData>('../../data/weekly_player_data.csv', (d) => ({
    position: d.position || '',
    fantasy_points_ppr: +d.fantasy_points_ppr || 0,
  })).then((data) => {
    const uniquePositions = Array.from(new Set(data.map((d) => d.position)));
    const fantasyPoints = data.map((d) => d.fantasy_points_ppr).filter((fp) => !isNaN(fp));

    const positionData = uniquePositions.map((position) => ({
      position,
      values: data.filter((d) => d.position === position).map((d) => d.fantasy_points_ppr),
    }));

    const x = d3.scaleLinear()
  .domain([d3.min(fantasyPoints) || 0, d3.max(fantasyPoints) || 0])
  .range([0, width]);


    const y = d3
      .scaleBand()
      .domain(uniquePositions)
      .range([0, height])
      .paddingInner(1);

    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(uniquePositions);

    const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
    const allDensity = positionData.map((group) => ({
      key: group.position,
      density: kde(group.values),
    }));

    const Y_SCALING_FACTOR = 1000;

    // Add X-axis
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5));

    // Add X-axis labels
    svg
      .append('text')
      .attr('x', 0)
      .attr('y', height + 35)
      .style('font-size', '12px')
      .text(x.domain()[0]); // Lower bound

    svg
      .append('text')
      .attr('x', width - 20)
      .attr('y', height + 35)
      .style('font-size', '12px')
      .attr('text-anchor', 'end')
      .text(x.domain()[1]); // Upper bound

    // Add Y-axis
    svg.append('g').call(d3.axisLeft(y));

    // Tooltip
    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('padding', '5px')
      .style('border-radius', '5px')
      .style('font-size', '12px');

    // Draw density curves
    svg.selectAll('areas')
  .data(allDensity)
  .enter()
  .append('path')
  .attr('transform', (d) => `translate(0,${y(d.key)! + y.bandwidth() / 2})`)
  .datum((d) => d.density)
  .attr('fill', (d, i) => color(allDensity[i].key)!)
  .attr('stroke', '#000')
  .attr('stroke-width', 1)
  .attr(
    'd',
    d3.line<[number, number]>()
      .curve(d3.curveBasis)
      .x((point) => x(point[0]))
      .y((point) => -point[1] * Y_SCALING_FACTOR) // Negative for upward ridgeline
  )
  .on('mouseover', function (event, d) {
    tooltip.style('visibility', 'visible');
  })
  .on('mousemove', (event, d) => {
    const [xValue] = d3.pointer(event, svg.node());
    const position = allDensity.find((density) => density.density === d)?.key;

    tooltip
      .style('visibility', 'visible')
      .html(
        `Position: ${position}<br>Points: ${Math.round(x.invert(xValue))}<br>`
      )
      .style('top', `${event.pageY + 10}px`)
      .style('left', `${event.pageX + 10}px`);
  })
  .on('mouseout', function () {
    tooltip.style('visibility', 'hidden');
  })

      .on('click', (event, d: [number, number][]) => {
        const position = allDensity.find((density) => density.density === d)?.key;
        if (position) {
          console.log(`Clicked on position: ${position}`);
        }
      });
  });

  function kernelDensityEstimator(kernel: (value: number) => number, X: number[]): (V: number[]) => [number, number][] {
    return function (V: number[]): [number, number][] {
      return X.map((x) => [x, d3.mean(V, (v) => kernel(x - v)) || 0]);
    };
  }

  function kernelEpanechnikov(k: number): (v: number) => number {
    return function (v: number): number {
      v = v / k;
      return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
    };
  }
}, [onSelectPosition]);



  return <svg ref={svgRef}></svg>;
};

export default RidgelinePlot;
