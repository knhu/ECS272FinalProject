import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

interface PlayerData {
  player_name: string;
  position: string;
  fantasy_points_ppr: number;
  draft_pick: number;
}

interface ScatterPlotProps {
  position: string;
  timeframe: "weekly" | "season";
  onBack: () => void;
}

interface PlayerNode extends d3.SimulationNodeDatum {
  player_name: string;
  avgFantasyPoints: number;
  avgDraftPick: number;
}

const ScatterPlot: React.FC<ScatterPlotProps> = ({ position, timeframe, onBack }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = 1600 - margin.left - margin.right;
    const height = 1200 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove(); // Clear previous content

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const csvFile =
      timeframe === "weekly"
        ? "../../data/weekly_player_data.csv"
        : "../../data/yearly_player_data.csv";

    d3.csv<PlayerData>(csvFile, (d) => ({
      player_name: d.player_name || "",
      position: d.position || "",
      fantasy_points_ppr: +d.fantasy_points_ppr || 0,
      draft_pick: +d.draft_pick || 0,
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
            avgDraftPick: d3.mean(records, (d) => d.draft_pick) || 0,
          })
        );

        // Define initial scales
        const x = d3
          .scaleLinear()
          .domain([
            d3.min(averagedData, (d) => d.avgFantasyPoints) || -2,
            d3.max(averagedData, (d) => d.avgFantasyPoints) || 1,
          ])
          .range([0, width]);

        const y = d3
          .scaleLinear()
          .domain([
            d3.min(averagedData, (d) => d.avgDraftPick) || -2,
            d3.max(averagedData, (d) => d.avgDraftPick) || 1,
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
                  )}<br>Avg Draft Pick: ${d.avgDraftPick.toFixed(2)}`
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
            d3.forceY<PlayerNode>((d) => y(d.avgDraftPick)).strength(0.7)
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

            // Update simulation forces with new scales
            simulation
              .force(
                "x",
                d3.forceX<PlayerNode>((d) => newX(d.avgFantasyPoints)).strength(
                  0.7
                )
              )
              .force(
                "y",
                d3.forceY<PlayerNode>((d) => newY(d.avgDraftPick)).strength(0.7)
              )
              .alpha(0.1) // Reset simulation to adjust nodes
              .restart();

            // Update circles
            // Update circles
g.selectAll<SVGCircleElement, PlayerNode>("circle")
  .attr("cx", (d) => newX(d.avgFantasyPoints))
  .attr("cy", (d) => newY(d.avgDraftPick));

          });

        d3.select(svgRef.current).call(zoom);
      })
      .catch((error) => console.error("Error loading data:", error));
  }, [position, timeframe]);

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: "10px" }}>
        Back to Ridgeline Plot
      </button>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ScatterPlot;
