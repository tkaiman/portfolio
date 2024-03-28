import React, { useState, useEffect } from 'react';
import * as _ from 'lodash';
import ShimmerBar from '../components/pretty/ShimmerBar.tsx';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#B9B9B9',
      // light: will be calculated from palette.primary.main,
      // dark: will be calculated from palette.primary.main,
      // contrastText: will be calculated to contrast with palette.primary.main
    },
    secondary: {
      main: '#E0C2FF',
      light: '#F5EBFF',
      // dark: will be calculated from palette.secondary.main,
      contrastText: '#47008F',
    },
  },
});

interface Review {
  id: number;
  title: string;
  content: string;
  rating: number;
  tags: string[];
  genres: string[];
}

function ReviewList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState<string[]>([]); // Initialize empty tags array
  const [clickedTags, setClickedTags] = useState<Record<string, boolean>>({});
  const clickedTagsList = Object.keys(clickedTags).filter(
    (tag) => clickedTags[tag]
  );
  const handleFunctionalityToggle = (tag: string) => {
    setClickedTags((prevClicked) => ({
      ...prevClicked,
      [tag]: !prevClicked[tag] || false, // Toggle clicked state
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          'src/projects/components/reviews/reviews.json'
        );
        const data: Review[] = await response.json();
        const sortedReviews = sortReviews(data, 'rating', 'desc');
        const allTags = data
          .flatMap((review) => review.genres)
          .filter((genre, index, self) => self.indexOf(genre) === index);
        setTags(allTags);
        setReviews(sortedReviews);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase()); // Convert search term to lowercase
  };

  const filteredReviews = filterReviews(
    reviews,
    searchTerm,
    [],
    clickedTagsList
  );

  function filterReviews(
    reviews: Review[],
    searchTerm: string,
    selectedTags: string[],
    selectedGenres: string[]
  ): Review[] {
    // Step 1: Filter based on tags and genres (if provided)
    let filteredReviews = reviews;
    if (selectedTags.length > 0 || selectedGenres.length > 0) {
      filteredReviews = filteredReviews.filter((review: Review) => {
        // Filter based on selected tags (if provided)
        const tagMatch =
          selectedTags.length === 0 ||
          selectedTags.every((tag) => review.tags.includes(tag.toLowerCase()));

        // Filter based on selected genres
        const genreMatch =
          selectedGenres.length === 0 ||
          selectedGenres.some((genre) =>
            review.genres.includes(genre.toLowerCase())
          );

        return tagMatch && genreMatch;
      });
    }

    // Step 2: Filter the already filtered list by search term (if provided)
    if (searchTerm) {
      filteredReviews = filteredReviews.filter((review: Review) => {
        const titleMatch = review.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const contentMatch = review.content
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        return titleMatch || contentMatch;
      });
    }

    return filteredReviews;
  }

  function sortReviews(
    reviews: Review[],
    sortBy: string,
    direction: string
  ): Review[] {
    switch (sortBy) {
      case 'rating':
        return _.orderBy(reviews, 'rating', direction); // Descending by rating
      case 'title':
        return _.orderBy(reviews, 'title', direction); // Ascending by title
      default:
        return reviews; // No change if sort criteria is invalid
    }
  }

  return (
    <div className="review-list">
      <div className="search-bar">
        <Stack direction="row" spacing={1}>
          <input
            type="text"
            placeholder="Search Reviews"
            value={searchTerm}
            onChange={handleSearch}
          />
          <ThemeProvider theme={theme}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                color={clickedTags[tag] ? 'success' : 'primary'}
                onClick={() => handleFunctionalityToggle(tag)}
              />
            ))}
          </ThemeProvider>
        </Stack>
      </div>
      {filteredReviews.map((review: Review) => (
        <Review key={review.id} review={review} />
      ))}
    </div>
  );
}

function Review({ review }: { review: Review }) {
  return (
    <article className="review">
      <ShimmerBar />
      <h2>
        {review.title} - {review.rating}/5
      </h2>
      <p>{review.content}</p>
    </article>
  );
}

export default ReviewList;
