import React, { useState } from 'react';
import RidgelinePlot from './components/RidgelinePlot';
import ScatterPlot from './components/ScatterPlot';
import Layer3 from './components/Layer3';

function App() {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null); // Selected position
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]); // Selected players for Layer3

  // Function to handle player selection/deselection
  const handlePlayerSelect = (playerName: string) => {
    setSelectedPlayers((prevSelected) =>
      prevSelected.includes(playerName)
        ? prevSelected.filter((name) => name !== playerName) // Deselect player
        : [...prevSelected, playerName] // Select player
    );
  };

  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
      {/* Page Title */}
      <h1>Fantasy Football Draft Helper</h1>

      {/* Render the appropriate component */}
      {!selectedPosition ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <RidgelinePlot
            timeframe="weekly" // Always passing "weekly"
            onSelectPosition={(position) => {
              console.log(`Selected Position: ${position}`);
              setSelectedPosition(position); // Update selected position
            }}
          />
        </div>
      ) : (
        <div>
          <div>
            <ScatterPlot
              position={selectedPosition}
              timeframe="weekly" // Always passing "weekly"
              onBack={() => {
                setSelectedPosition(null); // Reset position selection
                setSelectedPlayers([]); // Reset selected players
              }}
              selectedPlayers={selectedPlayers}
              onPlayerSelect={handlePlayerSelect} // Handle player selection
            />
          </div>
          {selectedPlayers.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' , marginBottom: '100px'}}>
              <Layer3
                selectedPlayers={selectedPlayers}
                timeframe="weekly" // Always passing "weekly"
                position={selectedPosition}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
