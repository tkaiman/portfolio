import ReviewList from './components/ReviewList.tsx';
import ShimmerBar from './components/pretty/ShimmerBar.tsx';

const GameReviews = () => {
  return (
    <>
      <div className="gMain">
        <ReviewList />
        <ShimmerBar />
      </div>
    </>
  );
};

export default GameReviews;
