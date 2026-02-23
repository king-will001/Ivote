const express = require('express');
const cors = require('cors');
const { connect } = require('mongoose');
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

connect(process.env.MONGO_URL, mongoOptions)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message || error);
    process.exit(1);
  });
