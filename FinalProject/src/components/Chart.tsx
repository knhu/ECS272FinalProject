import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface ChartProps {
  selectedPlayers: string[]; // Player names
  position: string; // Position of players (e.g., "QB", "RB", etc.)
  season: string; // Selected season ("all" or specific year)
  week: string; // Selected week ("all" or specific week)
}

const positionNames: Record<string, string> = {
  QB: "Quarterback",
  RB: "Running Back",
  WR: "Wide Receiver",
  TE: "Tight End",
};

const Chart: React.FC<ChartProps> = ({ selectedPlayers, position, season, week }) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedMetric, setSelectedMetric] = useState("fantasy_points_ppr");
  const [playerData, setPlayerData] = useState<any[]>([]);

  const colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"];

  useEffect(() => {
    if (selectedPlayers.length === 0) {
      console.warn("No players selected for the chart.");
      return;
    }

    const csvFile =
      season === "all" || (season !== "all" && week === "all")
        ? "../../data/yearly_player_data.csv"
        : "../../data/weekly_player_data.csv";

    d3.csv(csvFile, (d: any) => ({
      player_name: d.player_name || "",
      position: d.position || "",
      season: +d.season || 0,
      week: +d.week || 0,
      fantasy_points_ppr: +d.fantasy_points_ppr || 0,
      ...d,
    }))
      .then((data) => {
        let filtered = data.filter((d) => selectedPlayers.includes(d.player_name));

        // Filter for the specific season
        if (season !== "all") {
          filtered = filtered.filter((d) => `${d.season}` === season);
        }

        // Filter for the specific week
        if (week !== "all") {
          filtered = filtered.filter((d) => `${d.week}` === week);
        }

        // Handle missing players by defaulting their values to 0
        const completeData = selectedPlayers.map((player) => {
          const playerData = filtered.find((d) => d.player_name === player);
          return {
            player_name: player,
            [selectedMetric]: playerData ? playerData[selectedMetric] || 0 : 0,
          };
        });

        setPlayerData(completeData);
      })
      .catch((error) => console.error("Error loading data:", error));
  }, [selectedPlayers, season, week, selectedMetric]);

  useEffect(() => {
    if (!playerData || playerData.length === 0) {
      return;
    }

    const fullPosition = positionNames[position] || position;
    const title =
      season === "all"
        ? `Comparing ${fullPosition}s by ${selectedMetric.replace("_", " ")} across all seasons`
        : week === "all"
        ? `Comparing ${fullPosition}s by ${selectedMetric.replace("_", " ")} for season ${season}`
        : `Comparing ${fullPosition}s by ${selectedMetric.replace("_", " ")} for week ${week} of season ${season}`;

    const margin = { top: 60, right: 20, bottom: 170, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 700 - margin.top - margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    svg.selectAll("*").remove(); // Clear previous content

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    svg
      .append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", margin.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .text(title);

    const xValues = playerData.map((d) => d.player_name);
    const yValues = playerData.map((d) => +d[selectedMetric] || 0);

    const yMin = Math.min(0, d3.min(yValues) || 0);
    const yMax = Math.max(0, d3.max(yValues) || 1);

    const xScale = d3
      .scaleBand()
      .domain(xValues)
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([height, 0]);

    g.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    g.append("g").call(d3.axisLeft(yScale));

    svg
      .append("text")
      .attr("x", (width + margin.left + margin.right) / 2)
      .attr("y", height + margin.top + 50)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("Players");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height + margin.top + margin.bottom) / 2)
      .attr("y", 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text(selectedMetric.replace("_", " ").toUpperCase());

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("padding", "5px")
      .style("border-radius", "4px")
      .style("display", "none");

    const bars = g.selectAll(".bar").data(playerData);

    bars
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", (d) => xScale(d.player_name) as number)
      .attr("y", yScale(0))
      .attr("width", xScale.bandwidth())
      .attr("height", 0)
      .attr("fill", (d, i) => colors[i % colors.length])
      .on("mouseover", (event, d) => {
        const scoreLabel =
          season === "all"
            ? `Average ${selectedMetric.replace("_", " ")} across all seasons: `
            : week === "all"
            ? `Total ${selectedMetric.replace("_", " ")} for season: `
            : `${selectedMetric.replace("_", " ")}: `;
        tooltip
          .style("display", "block")
          .html(`<strong>${d.player_name}</strong><br>${scoreLabel}${d[selectedMetric]}`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 20 + "px");
      })
      .on("mouseout", () => tooltip.style("display", "none"))
      .transition()
      .duration(750)
      .attr("y", (d) => (d[selectedMetric] >= 0 ? yScale(d[selectedMetric]) : yScale(0)))
      .attr("height", (d) => Math.abs(yScale(d[selectedMetric]) - yScale(0)));

    bars.exit().remove();
  }, [playerData, selectedMetric, position, season, week]);

  if (!playerData || playerData.length === 0) {
    return <p>No data available for the selected players and filters.</p>;
  }

  return (
    <div>
      <h3>Player Comparison Chart</h3>
      <div style={{ marginBottom: "10px" }}>
        <label>
          Metric:
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            style={{ marginLeft: "10px" }}
          >
            {["fantasy_points_ppr", ...(positionNames[position] ? [] : [])].map((metric) => (
              <option key={metric} value={metric}>
                {metric.replace("_", " ").toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default Chart;
