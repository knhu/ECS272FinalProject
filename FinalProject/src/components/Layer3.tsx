import React, { useState, useEffect } from "react";
import * as d3 from "d3";
import Table from "./Table";
import Chart from "./Chart";

interface PlayerData {
  player_name: string;
  position: string;
  season: number;
  week: number;
  fantasy_points_ppr: number;
  [key: string]: any; // Flexible for other columns
}

interface Layer3Props {
  selectedPlayers: string[]; // List of selected player names
  position: string; // Position of players (e.g., QB, WR, etc.)
}

const Layer3: React.FC<Layer3Props> = ({ selectedPlayers, position }) => {
  const [season, setSeason] = useState<string>("all"); // Default to "all" seasons
  const [week, setWeek] = useState<string>("all"); // Default to "all" weeks
  const [data, setData] = useState<PlayerData[]>([]); // Loaded data
  const [filteredData, setFilteredData] = useState<PlayerData[]>([]); // Filtered based on dropdowns
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([]); // Seasons for dropdown

  const isTable = selectedPlayers.length === 1; // Table if one player, chart if 2+ players

  useEffect(() => {
    const csvFile =
      season === "all" ? "../../data/yearly_player_data.csv" : "../../data/weekly_player_data.csv";

    d3.csv<PlayerData>(csvFile, (d) => ({
      player_name: d.player_name || "",
      position: d.position || "",
      season: +d.season || 0,
      week: +d.week || 0,
      fantasy_points_ppr: +d.fantasy_points_ppr || 0,
      ...d,
    }))
      .then((loadedData) => {
        // Filter data for selected players
        const relevantData = loadedData.filter((d) =>
          selectedPlayers.includes(d.player_name)
        );

        // Identify fields to keep (non-zero, non-undefined across all rows)
        const metricsToCheck = Object.keys(relevantData[0] || {}).filter(
          (key) =>
            key !== "player_name" &&
            key !== "position" &&
            key !== "season" &&
            key !== "week"
        );

        const fieldsToKeep = metricsToCheck.filter((metric) =>
          relevantData.some(
            (player) =>
              player[metric] !== undefined && // Exclude undefined
              player[metric] !== "" && // Exclude empty
              player[metric] !== 0 && // Exclude zero values
              player[metric] !== "0.0" // Exclude formatted zero strings
          )
        );

        // Filter each player's data to include only fieldsToKeep
        const filteredPlayers = relevantData.map((player) =>
          Object.fromEntries(
            Object.entries(player).filter(([key]) =>
              fieldsToKeep.includes(key) || ["player_name", "position", "season", "week"].includes(key)
            )
          )
        );

        setData(filteredPlayers);

        // Update available seasons
        const seasons = Array.from(
          new Set(filteredPlayers.map((d) => d.season))
        ).sort((a, b) => a - b);
        setAvailableSeasons(seasons);
      })
      .catch((error) => console.error("Error loading data:", error));
  }, [selectedPlayers, season]);

  useEffect(() => {
    // Filter data based on season and week
    let filtered = data;
    if (season !== "all") {
      filtered = filtered.filter((d) => `${d.season}` === season);
    }
    if (week !== "all") {
      filtered = filtered.filter((d) => `${d.week}` === week);
    }

    setFilteredData(filtered);
  }, [data, season, week]);

  return (
    <div>
      {/* Dropdowns for season and week selection */}
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="season-select" style={{ marginRight: "10px" }}>
          Season:
        </label>
        <select
          id="season-select"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
        >
          <option value="all">All</option>
          {availableSeasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {season !== "all" && (
          <>
            <label htmlFor="week-select" style={{ marginLeft: "20px", marginRight: "10px" }}>
              Week:
            </label>
            <select
              id="week-select"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
            >
              <option value="all">All</option>
              {[...Array(18).keys()].map((w) => (
                <option key={w + 1} value={w + 1}>
                  {w + 1}
                </option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Render Table or Chart */}
      {isTable ? (
        <Table playerData={filteredData[0]} />
      ) : (
        <Chart
          selectedPlayers={selectedPlayers} // Pass player names
          position={position} // Pass position
          season={season} // Pass selected season
          week={week} // Pass selected week
        />
      )}
    </div>
  );
};

export default Layer3;
