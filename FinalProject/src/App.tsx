import React, { useState } from 'react';
import RidgelinePlot from './components/RidgelinePlot';

function App() {
  const [timeframe, setTimeframe] = useState<'weekly' | 'season'>('weekly'); // Weekly or Season
  const [viewType, setViewType] = useState<'players' | 'teams'>('players'); // Players or Teams

  return (
    <div>
      {/* Dropdowns for controlling the view */}
      <div style={{ marginBottom: '20px' }}>
        {/* Timeframe Dropdown */}
        <label htmlFor="timeframe-select" style={{ marginRight: '10px' }}>
          View By:
        </label>
        <select
          id="timeframe-select"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'weekly' | 'season')}
        >
          <option value="weekly">Weekly</option>
          <option value="season">Season</option>
        </select>

        {/* View Type Dropdown */}
        <label htmlFor="viewtype-select" style={{ marginLeft: '20px', marginRight: '10px' }}>
          View Type:
        </label>
        <select
          id="viewtype-select"
          value={viewType}
          onChange={(e) => setViewType(e.target.value as 'players' | 'teams')}
        >
          <option value="players">Players</option>
          <option value="teams">Teams</option>
        </select>
      </div>

      {/* Render the appropriate component based on `viewType` */}
      {viewType === 'players' ? (
        <RidgelinePlot timeframe={timeframe} onSelectPosition={(position) => console.log(`Selected: ${position}`)} />
      ) : (
        <div>
          {/* Future TeamsRidgelinePlot Component */}
          <p>Teams Ridge Plot will go here.</p>
        </div>
      )}
    </div>
  );
}

export default App;
