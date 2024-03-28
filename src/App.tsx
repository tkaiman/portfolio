import './App.css';
import { BrowserRouter, Link, Routes, Route } from 'react-router-dom';
import GameReviews from './projects/GameReviews.tsx';
import Landing from './projects/Landing.tsx';

function App() {
  return (
    <>
      <div className="NavBar">
        <BrowserRouter>
          <Link to="/" className="links">
            Home
          </Link>
          &nbsp; | &nbsp;
          <Link to="/GameReviews" className="links">
            {' '}
            Game Reviews
          </Link>
          <div className="personal"></div>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/GameReviews" element={<GameReviews />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  );
}

export default App;
