export type Movie = {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  duration: number;
  language: string[];
  releaseDate: string;
  posterUrl: string;
  trailerUrl: string;
  rating: number;
};

export type MoviesPageResponse = {
  items: Movie[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ShowtimeSeat = {
  row: string;
  number: number;
  type: string;
  price: number;
  status: 'Available' | 'Locked' | 'Booked';
  user?: string | null;
  lockedAt?: string | null;
};

export type Showtime = {
  _id: string;
  movie: any;
  theater: any;
  screen: any;
  startTime: string;
  price: number;
  seats: ShowtimeSeat[];
};

export type Booking = {
  _id: string;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
  totalAmount: number;
  seats: { row: string; number: number; price: number }[];
  createdAt: string;
  showtime: any;
};

