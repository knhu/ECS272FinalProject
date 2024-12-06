import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

interface PlayerData {
  player_name: string;
  position: string;
  fantasy_points_ppr: number;
  passing_yards?: number;
  pass_td?: number;
  rushing_yards?: number;
  run_td?: number;
  receiving_yards?: number;
  reception_td?: number;
  receiving_air_yards?: number;
}

interface ScatterPlotProps {
  position: string;
  timeframe: "weekly" | "season";
  onBack: () => void;
}

interface PlayerNode extends d3.SimulationNodeDatum {
  player_name: string;
  avgFantasyPoints: number;
  avgMetric: number;
}

const positionMetrics = {
  QB: ["passing_yards", "pass_td"],
  RB: ["rushing_yards", "run_td"],
  WR: ["receiving_yards", "reception_td"],
  TE: ["receiving_yards", "receiving_air_yards"],
};

const positionNames = {
  QB: "Quarterback",
  RB: "Running Back",
  WR: "Wide Receiver",
  TE: "Tight End",
};

const ScatterPlot: React.FC<ScatterPlotProps> = ({ position, timeframe, onBack }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const initialTransform = d3.zoomIdentity; // Initial zoom transform
  const [selectedMetric, setSelectedMetric] = useState(positionMetrics[position][0]); // Default Y-axis metric

  useEffect(() => {
    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 1000 - margin.left - margin.right; // Adjusted dimensions
    const height = 750 - margin.top - margin.bottom; // Adjusted dimensions

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove(); // Clear previous content

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add bounding box for the graph
    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width)
      .attr("height", height)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1);

    const csvFile =
      timeframe === "weekly"
        ? "../../data/weekly_player_data.csv"
        : "../../data/yearly_player_data.csv";

    d3.csv<PlayerData>(csvFile, (d) => ({
      player_name: d.player_name || "",
      position: d.position || "",
      fantasy_points_ppr: +d.fantasy_points_ppr || 0,
      passing_yards: d.passing_yards ? +d.passing_yards : undefined,
      pass_td: d.pass_td ? +d.pass_td : undefined,
      rushing_yards: d.rushing_yards ? +d.rushing_yards : undefined,
      run_td: d.run_td ? +d.run_td : undefined,
      receiving_yards: d.receiving_yards ? +d.receiving_yards : undefined,
      reception_td: d.reception_td ? +d.reception_td : undefined,
      receiving_air_yards: d.receiving_air_yards
        ? +d.receiving_air_yards
        : undefined,
    }))
      .then((data) => {
        const filteredData = data.filter((d) => d.position === position);

        // Aggregate by player_name and calculate averages
        const averagedData = Array.from(
          d3.group(filteredData, (d) => d.player_name),
          ([player_name, records]) => ({
            player_name,
            avgFantasyPoints:
              d3.mean(records, (d) => d.fantasy_points_ppr) || 0,
            avgMetric: d3.mean(records, (d) => d[selectedMetric] as number) || 0,
          })
        );

        // Define initial scales
        const x = d3
          .scaleLinear()
          .domain([
            d3.min(averagedData, (d) => d.avgFantasyPoints) || -0.5,
            d3.max(averagedData, (d) => d.avgFantasyPoints) || 1,
          ])
          .range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([
            d3.min(averagedData, (d) => d.avgMetric) || -0.5,
            d3.max(averagedData, (d) => d.avgMetric) || 1,
          ])
          .range([height, 0]);

        const xAxis = g
          .append("g")
          .attr("transform", `translate(0,${height})`)
          .call(d3.axisBottom(x));

        const yAxis = g.append("g").call(d3.axisLeft(y));

        // Tooltip
        const tooltip = d3
          .select("body")
          .append("div")
          .style("position", "absolute")
          .style("visibility", "hidden")
          .style("background", "white")
          .style("border", "1px solid #ccc")
          .style("padding", "5px")
          .style("border-radius", "5px")
          .style("font-size", "12px");

        // Add circles for nodes
        const updateNodes = (nodes: PlayerNode[]) => {
          g.selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 5)
            .attr("fill", "steelblue")
            .attr("stroke", "black")
            .attr("cx", (d) => d.x!)
            .attr("cy", (d) => d.y!)
            .on("mouseover", function (event, d) {
              tooltip
                .style("visibility", "visible")
                .html(
                  `Player: ${d.player_name}<br>Avg Points: ${d.avgFantasyPoints.toFixed(
                    2
                  )}<br>${selectedMetric}: ${d.avgMetric.toFixed(2)}`
                )
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
            })
            .on("mousemove", (event) => {
              tooltip
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", () => tooltip.style("visibility", "hidden"));
        };

        // Add force simulation
        const simulation = d3
          .forceSimulation<PlayerNode>()
          .nodes(
            averagedData.map((d) => ({
              ...d,
              x: Math.random() * width, // Random initial position
              y: Math.random() * height,
            }))
          )
          .force(
            "x",
            d3.forceX<PlayerNode>((d) => x(d.avgFantasyPoints)).strength(0.7)
          )
          .force(
            "y",
            d3.forceY<PlayerNode>((d) => y(d.avgMetric)).strength(0.7)
          )
          .force("collision", d3.forceCollide(5)) // Prevent overlap
          .on("tick", () => updateNodes(simulation.nodes()));

        // Zoom functionality
        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([1, 10])
          .translateExtent([
            [0, 0],
            [width, height],
          ])
          .on("zoom", (event) => {
            const newTransform = event.transform;

            // Rescale axes
            const newX = newTransform.rescaleX(x);
            const newY = newTransform.rescaleY(y);

            xAxis.call(d3.axisBottom(newX));
            yAxis.call(d3.axisLeft(newY));

            // Update circles
            g.selectAll<SVGCircleElement, PlayerNode>("circle")
              .attr("cx", (d) => newX(d.avgFantasyPoints))
              .attr("cy", (d) => newY(d.avgMetric));
          });

        d3.select(svgRef.current).call(zoom);

        // Reset zoom button
        d3.select("#reset-zoom").on("click", () => {
          d3.select(svgRef.current).call(zoom.transform, initialTransform);
          xAxis.call(d3.axisBottom(x));
          yAxis.call(d3.axisLeft(y));
          updateNodes(simulation.nodes());
        });
      })
      .catch((error) => console.error("Error loading data:", error));
  }, [position, timeframe, selectedMetric]);

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: "10px" }}>
        Back to Ridgeline Plot
      </button>
      <h2 style={{ textAlign: "center" }}>
        Distribution of {positionNames[position]} Based on Fantasy Points and{" "}
        {selectedMetric}
      </h2>
      <label>
        Select Y-axis Metric:
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          style={{ marginLeft: "10px" }}
        >
          {positionMetrics[position].map((metric) => (
            <option key={metric} value={metric}>
              {metric.replace("_", " ").toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <button id="reset-zoom" style={{ marginLeft: "20px" }}>
        Reset Zoom
      </button>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ScatterPlot;
