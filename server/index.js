const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { connect } = mongoose;
const helmet = require('helmet');
const fileUpload = require('express-fileupload');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const requiredEnv = ['MONGO_URL', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const parseOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const clientOrigins = parseOrigins(
  process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:3000'
);
const allowNullOrigin = process.env.ALLOW_NULL_ORIGIN === 'true';
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (origin === 'null' && allowNullOrigin) {
      return callback(null, true);
    }
    if (clientOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
};

const Routes = require('./routes/Routes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { apiLimiter } = require('./middleware/rateLimiters');
const { csrfProtection } = require('./middleware/csrfMiddleware');

const sanitizeRequest = (options = {}) => (req, res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) {
      mongoSanitize.sanitize(req[key], options);
    }
  });
  next();
};

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true');

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeRequest({ replaceWith: '_' }));
app.use(hpp());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(apiLimiter);
app.use(
  fileUpload({
    createParentPath: true,
    limits: { fileSize: 5 * 1024 * 1024 },
    abortOnLimit: true,
    safeFileNames: true,
    preserveExtension: true,
  })
);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(csrfProtection);
app.use('/api', Routes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const forceIpv4 = process.env.MONGO_FORCE_IPV4 !== 'false';
const mongoOptions = {
  serverSelectionTimeoutMS:
    Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS) || 10000,
  connectTimeoutMS: Number(process.env.MONGO_CONNECT_TIMEOUT_MS) || 10000,
  socketTimeoutMS: Number(process.env.MONGO_SOCKET_TIMEOUT_MS) || 20000,
  ...(forceIpv4 ? { family: 4 } : {}),
};

const parseOptionalNumber = (value) => {
  if (value === undefined || value === null || String(value).trim() === '') {
    return Number.NaN;
  }
  return Number(value);
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const retryDelayEnv = parseOptionalNumber(process.env.MONGO_RETRY_DELAY_MS);
const retryDelayMs =
  Number.isFinite(retryDelayEnv) && retryDelayEnv >= 0 ? retryDelayEnv : 5000;
const retryLimitEnv = parseOptionalNumber(process.env.MONGO_RETRY_ATTEMPTS);
const retryLimit = Number.isFinite(retryLimitEnv)
  ? Math.max(0, retryLimitEnv)
  : NODE_ENV === 'production'
    ? 10
    : Number.POSITIVE_INFINITY;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectMongoWithRetry = async () => {
  let attempt = 0;

  while (true) {
    attempt += 1;
    try {
      await connect(process.env.MONGO_URL, mongoOptions);
      console.log(`MongoDB connected (attempt ${attempt})`);
      app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
      return;
    } catch (error) {
      const message = error?.message || String(error);
      console.error(`MongoDB connection error (attempt ${attempt}):`, message);
      if (/whitelist|IP address|network access/i.test(message)) {
        console.error(
          'Atlas network access may be blocking this IP. Check Network Access in MongoDB Atlas.'
        );
      }

      const retriesUsed = attempt - 1;
      const hasRetriesLeft =
        !Number.isFinite(retryLimit) || retriesUsed < retryLimit;
      if (!hasRetriesLeft) {
        process.exit(1);
      }

      console.warn(`Retrying MongoDB connection in ${retryDelayMs}ms...`);
      await sleep(retryDelayMs);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

connectMongoWithRetry();
