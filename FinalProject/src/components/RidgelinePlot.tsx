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

    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    d3.csv<PlayerData>('../../data/weekly_player_data.csv', (d) => {
      return {
        position: d.position || '',
        fantasy_points_ppr: +d.fantasy_points_ppr || 0,
      };
    }).then((data) => {
      const positions = Array.from(new Set(data.map((d) => d.position)));
      const positionData = positions.map((position) => {
        return {
          position,
          values: data
            .filter((d) => d.position === position)
            .map((d) => d.fantasy_points_ppr),
        };
      });

      const x = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(data, (d) => d.fantasy_points_ppr) || 0,
        ])
        .range([0, width]);

      const y = d3
        .scaleBand()
        .domain(positions)
        .range([0, height])
        .paddingInner(1);

      const color = d3.scaleOrdinal(d3.schemeCategory10).domain(positions);

      const kde = kernelDensityEstimator(
        kernelEpanechnikov(7),
        x.ticks(40)
      );

      const allDensity: DensityData[] = positionData.map((group) => {
        return {
          key: group.position,
          density: kde(group.values),
        };
      });

      svg
        .selectAll('areas')
        .data(allDensity)
        .enter()
        .append('path')
        .attr('transform', (d) => `translate(0,${y(d.key)})`)
        .datum((d) => d.density) // Bind only the density array (array of [number, number] tuples)
        .attr('fill', (d, i) => color(allDensity[i].key)!)
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr(
            'd',
            d3
            .line<[number, number]>() // Explicitly type the line generator for [number, number]
            .curve(d3.curveBasis) // Use smooth curve
            .x((point) => x(point[0])) // Access the x-value (point[0])
            .y((point) => -point[1]) // Access the y-value (point[1])
        )
        .on('mouseover', function () {
            d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 0.7);
        })
        .on('mouseout', function () {
            d3.select(this)
            .transition()
            .duration(200)
            .attr('fill-opacity', 1);
        })
        .on('click', (event, d: [number, number][]) => {
            // Find the position key for the clicked density array
            const position = allDensity.find((density) => density.density === d)?.key;
            if (position) {
            onSelectPosition(position); // Pass the key to the callback
            }
        });


      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', -margin.top / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('text-decoration', 'underline')
        .text('Weekly Fantasy Points (PPR) by Position');

      svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom / 2)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Fantasy Points (PPR)');

      svg
        .append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left / 1.5)
        .attr('text-anchor', 'middle')
        .style('font-size', '12px')
        .text('Position');
    });

    function kernelDensityEstimator(
      kernel: (value: number) => number,
      X: number[]
    ): (V: number[]) => [number, number][] {
      return function (V: number[]): [number, number][] {
        return X.map((x) => [
          x,
          d3.mean(V, (v) => kernel(x - v)) || 0,
        ]);
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
