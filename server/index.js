const express = require('express');
const cors = require('cors');
const {connect} = require('mongoose')
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Routes = require('./routes/Routes')
const {notFound, errorHandler} = require('./middleware/errorMiddleware')
const fileUpload = require('express-fileupload');

const app = express();
// express.json doesn't accept `extended` — that option is for urlencoded
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cors({ credentials: true, origin: ['http://localhost:3000'] }));
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
}));

const PORT = process.env.PORT || 5000;

// Avoid logging secrets like full DB credentials
console.log("MONGO_URL loaded:", Boolean(process.env.MONGO_URL));

app.use('/api', Routes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(notFound);
app.use(errorHandler);

const MONGO_URL = process.env.MONGO_URL;

if (!MONGO_URL) {
  console.error("❌ Missing MONGO_URL in server/.env");
  process.exitCode = 1;
} else {
  const connectWithRetry = async (attempt = 1) => {
    try {
      await connect(MONGO_URL, {
        // Atlas + DNS + TLS can exceed 5s on cold start; the MongoDB driver default is 30s.
        serverSelectionTimeoutMS: 30_000,
      });

      console.log("✅ MongoDB connected");
      app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
    } catch (error) {
      console.error(
        `❌ MongoDB connection attempt ${attempt} failed:`,
        error?.message || error
      );

      if (error?.name === "MongooseServerSelectionError") {
        console.error(
          "Hint: If you're using MongoDB Atlas, check Network Access IP allowlist and ensure port 27017 isn't blocked."
        );
      }

      if (process.env.NODE_ENV === "production") {
        process.exitCode = 1;
        return;
      }

      const delayMs = Math.min(30_000, 1_000 * 2 ** Math.min(attempt, 5));
      console.log(`Retrying MongoDB connection in ${delayMs}ms...`);
      setTimeout(() => void connectWithRetry(attempt + 1), delayMs);
    }
  };

  void connectWithRetry();
}
