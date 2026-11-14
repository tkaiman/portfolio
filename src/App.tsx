import { useCallback, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import './App.css';
import FluidBasinCanvas from './projects/FluidBasinCanvas.tsx';
import GameReviews from './projects/GameReviews.tsx';
import Landing, { type FluidMode } from './projects/Landing.tsx';

const WASHI_PLATE = '/assets/plates/washi-paper.png';

function App() {
  const [fluidMode, setFluidMode] = useState<FluidMode>('drop');
  const [viscosity, setViscosity] = useState<number>(0.14);
  const [dropPulseCount, setDropPulseCount] = useState<number>(0);
  const [flowNormalized, setFlowNormalized] = useState<number>(0.31);

  const handleDropPulse = useCallback(() => {
    setDropPulseCount((c) => c + 1);
  }, []);

  const baseProps = {
    fluidMode,
    setFluidMode,
    viscosity,
    setViscosity,
    flowNormalized,
    washiPlateSrc: WASHI_PLATE,
    onDropPulse: handleDropPulse,
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Landing
              {...baseProps}
              canvasSlot={
                <FluidBasinCanvas
                  fluidMode={fluidMode}
                  viscosity={viscosity}
                  dropPulseCount={dropPulseCount}
                  variant="home"
                  onFlowChange={setFlowNormalized}
                />
              }
            />
          }
        />
        <Route
          path="/GameReviews"
          element={
            <GameReviews
              {...baseProps}
              canvasSlot={
                <FluidBasinCanvas
                  fluidMode={fluidMode}
                  viscosity={viscosity}
                  dropPulseCount={dropPulseCount}
                  variant="masthead"
                  onFlowChange={setFlowNormalized}
                />
              }
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
