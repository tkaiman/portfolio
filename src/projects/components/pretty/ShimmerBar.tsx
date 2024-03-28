import styled from 'styled-components';


const ShimmerBar = styled.div`
  width: 100%;  /* Adjust width as needed */
  height: 2px;   /* Adjust height as needed */
  margin-top: 10px;
  background: linear-gradient(to right, #6b4ea5 0%, #666ecb 50%, #6b4ea5 100%);
  background-size: 200% 100%;
  animation: shimmer 7.0s ease-in-out infinite;
  border-radius: 2px;

  @keyframes shimmer {
    from {
      background-position: 0 0;
    }
    to {
      background-position: -200% 0;
    }
  }

  /* Style for hover effect */
  &:hover {
    animation-play-state: paused;
  }
`;

export default ShimmerBar;
