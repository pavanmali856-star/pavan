const dotenv = require('dotenv');
const mongoose = require('mongoose');

const User = require('./models/User');
const Movie = require('./models/Movie');
const Theater = require('./models/Theater');
const Screen = require('./models/Screen');
const Seat = require('./models/Seat');
const Showtime = require('./models/Showtime');

dotenv.config();

function buildSeatLayout() {
  const rows = [];
  const rowLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  for (const row of rowLetters) {
    const seats = [];
    for (let n = 1; n <= 12; n++) {
      const isPremium = row === 'G' || row === 'H';
      seats.push({
        number: n,
        type: isPremium ? 'Premium' : 'Standard',
        priceModifier: isPremium ? 60 : 0,
        isAvailable: true,
      });
    }
    rows.push({ row, seats });
  }
  return rows;
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  // Important: we drop the `movies` collection (not just delete docs) so old
  // text-index options don't conflict with our `language: string[]` field.
  await Promise.all([
    User.deleteMany({}),
    Theater.deleteMany({}),
    Screen.deleteMany({}),
    Seat.deleteMany({}),
    Showtime.deleteMany({}),
  ]);
  try {
    await Movie.collection.drop();
  } catch (_) {
    // ignore (collection may not exist yet)
  }

  const admin = await User.create({
    name: 'Admin',
    email: 'admin@pm.pm',
    password: 'Admin@12345',
    role: 'admin',
  });
  const user = await User.create({
    name: 'Demo User',
    email: 'user@pm.pm',
    password: 'User@12345',
    role: 'user',
  });

  const movies = await Movie.insertMany([
    {
      title: 'NEON DUNE: Echo Protocol',
      description: 'A futuristic desert heist with quantum echoes and betrayal.',
      genre: ['Sci-Fi', 'Thriller'],
      duration: 142,
      language: ['English'],
      releaseDate: new Date('2026-01-12'),
      posterUrl: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?auto=format&fit=crop&w=800&q=60',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 8.6,
    },
    {
      title: 'KAIJU CIRCUIT',
      description: 'Mechs, monsters, and a rogue AI that learned cinema.',
      genre: ['Action', 'Adventure'],
      duration: 128,
      language: ['English', 'Japanese'],
      releaseDate: new Date('2025-11-21'),
      posterUrl: 'https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=800&q=60',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 7.9,
    },
    {
      title: 'MIDNIGHT ORBIT',
      description: 'A space-station mystery told backwards in time.',
      genre: ['Mystery', 'Sci-Fi'],
      duration: 116,
      language: ['English'],
      releaseDate: new Date('2025-09-03'),
      posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=60',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 8.1,
    },
    {
      title: 'SILK CITY NOIR',
      description: 'Neon rain, moral debts, and a detective with no past.',
      genre: ['Crime', 'Drama'],
      duration: 124,
      language: ['English'],
      releaseDate: new Date('2025-10-14'),
      posterUrl: 'https://images.unsplash.com/photo-1517602380424-0a7bce8c4d49?auto=format&fit=crop&w=800&q=60',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 7.6,
    },
  ]);

  const theater = await Theater.create({
    name: 'NeoPlex Quantum Mall',
    location: {
      address: '42 Hyperloop Avenue',
      city: 'Neo City',
      state: 'Future State',
      zipCode: '424242',
    },
    owner: admin._id,
  });

  const screen = await Screen.create({
    theater: theater._id,
    name: 'Screen 1 — HoloVision',
    type: 'IMAX',
    capacity: 96,
    seatLayout: buildSeatLayout(),
  });

  theater.screens.push(screen._id);
  await theater.save();

  const seatDocs = [];
  screen.seatLayout.forEach((row) => {
    row.seats.forEach((seat) => {
      seatDocs.push({
        screen: screen._id,
        theater: theater._id,
        row: row.row,
        number: seat.number,
        type: seat.type,
        priceModifier: seat.priceModifier,
        isAvailable: seat.isAvailable !== false,
      });
    });
  });
  await Seat.insertMany(seatDocs, { ordered: false });

  const now = Date.now();
  const showtimes = [];
  for (let i = 0; i < movies.length; i++) {
    showtimes.push(
      await Showtime.create({
        movie: movies[i]._id,
        theater: theater._id,
        screen: screen._id,
        startTime: new Date(now + (i + 1) * 60 * 60 * 1000),
        price: 220,
        seats: seatDocs
          .filter((s) => s.isAvailable !== false)
          .map((s) => ({ row: s.row, number: s.number, type: s.type, price: 220 + (s.priceModifier || 0), status: 'Available' })),
      })
    );
  }

  console.log('Seed complete');
  console.log('Admin:', { email: admin.email, password: 'Admin@12345' });
  console.log('User:', { email: user.email, password: 'User@12345' });
  console.log('Theater:', theater._id.toString());
  console.log('Screen:', screen._id.toString());
  console.log('Showtimes:', showtimes.map((s) => s._id.toString()));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

