import React from "react";

interface TableProps {
  playerData: Record<string, string | number>; // Key-value pairs of player's stats
}

const Table: React.FC<TableProps> = ({ playerData }) => {
  // Check if there's any data to display
  if (!playerData || Object.keys(playerData).length === 0) {
    return <p>No data available for the selected player.</p>;
  }

  return (
    <div style={{ marginTop: "20px", overflowX: "auto" }}>
      <h3>Player Data</h3>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={headerStyle}>Statistic</th>
            <th style={headerStyle}>Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(playerData).map(([stat, value]) => (
            <tr key={stat}>
              <td style={cellStyle}>{stat}</td>
              <td style={cellStyle}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Styles for table cells and headers
const headerStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  textAlign: "left",
  padding: "8px",
  backgroundColor: "#f4f4f4",
  fontWeight: "bold",
};

const cellStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  textAlign: "left",
  padding: "8px",
};

export default Table;
