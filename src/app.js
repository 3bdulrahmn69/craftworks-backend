require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const routes = require('./routes');

// Winston logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

// Morgan HTTP request logging
app.use(morgan('dev', { stream: { write: msg => logger.info(msg.trim()) } }));

// TODO: Import and use routes here
app.use('/api', routes);

// Error handler for Mongoose CastError and other errors
app.use((err, req, res, next) => {
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    logger.warn(`Invalid ObjectId: ${err.value} on ${req.method} ${req.originalUrl}`);
    return res.status(404).json({ message: 'Resource not found (invalid ID)' });
  }
  if (err.status) {
    logger.warn(`${err.status} - ${err.message} on ${req.method} ${req.originalUrl}`);
    return res.status(err.status).json({ message: err.message });
  }
  logger.error(err.stack || err);
  res.status(500).json({ message: 'Internal server error' });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch(err => logger.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`)); 