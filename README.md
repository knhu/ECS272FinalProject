# ECS 272 Final Project

## Fantasy Football Assistant

### Developed by Ariel Kamen and Kevin Nhu

This project is a **Player Performance Analysis Tool** designed to visualize and compare player statistics across multiple positions in fantasy sports. It includes various interactive charts, such as ridgeline plots, scatter plots, and bar charts, allowing users to explore and analyze player data dynamically.

---

## Features

### 1. **Ridgeline Plot**
- Visualizes the distribution of fantasy points for different positions.
- Smooth animations for density transitions.
- Interactive tooltips and click-based position selection.

### 2. **Scatter Plot Analysis**
- Displays players as nodes in a scatter plot.
- X-axis: `Fantasy Points`
- Y-axis: Position-specific metrics.
- Includes tooltips for detailed information.
- Supports zooming, panning, and interactive player selection.

### 3. **Bar Chart Visualization**
- Displays player performance metrics.
- Animated transitions for smooth visualization.
- Supports dynamic metric selection based on player position:
  - **Quarterbacks (QB):** `pass_attempts`, `complete_pass`, `passing_yards`, `passing_td`, `interceptions`
  - **Running Backs (RB):** `rush_attempts`, `rushing_yards`, `rushing_td`
  - **Wide Receivers (WR):** `targets`, `receptions`, `receiving_yards`, `receiving_td`
  - **Tight Ends (TE):** `targets`, `receptions`, `receiving_yards`, `receiving_td`

---

## File Structure

- **`RidgelinePlot.tsx`**
  - Implements the ridgeline plot for density estimation.
  - Animates kernel density transitions.
  - Includes interactive tooltips and click actions.

- **`ScatterPlot.tsx`**
  - Implements the scatter plot with force-directed physics.
  - Supports metric selection and interactive zoom/pan.

- **`Chart.tsx`**
  - Implements the bar chart.
  - Includes animations for bar transitions.
  - Dynamically updates metrics based on the selected player position.

---

## Installation

### Prerequisites
- **Node.js** (>=16.x)
- **npm** (>=8.x)
- A compatible web browser (Chrome, Firefox, Edge, etc.)

### Steps
1. Clone the repository:
   ```bash
   git clone <repository_url>
   cd <repository_name>
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## Usage

### Loading Data
- Place the data files in the `data` directory.
  - `yearly_player_data.csv` for seasonal analysis.
  - `weekly_player_data.csv` for weekly analysis.

### Interactions
1. **Ridgeline Plot:**
   - Hover over density curves for tooltips.
   - Click on a position to filter by position.

2. **Scatter Plot:**
   - Select a Y-axis metric.
   - Zoom, pan, and click on players to view detailed stats.

3. **Bar Chart:**
   - Select players and metrics for comparison.
   - View tooltips for detailed scores.

---