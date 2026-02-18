const express = require('express');
const http = require('http');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startSeatLockReaper } = require('./jobs/seatLockReaper');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
    credentials: true,
  })
);
app.use(helmet());
app.use(compression());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 240,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })
);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Routes
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/movies', require('./routes/movieRoutes'));
app.use('/api/theaters', require('./routes/theaterRoutes'));
app.use('/api/showtimes', require('./routes/showtimeRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

app.get('/', (req, res) => {
  res.send('API is running...');
});
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'movie-booking-api', time: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
initSocket(server);
startSeatLockReaper();

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
