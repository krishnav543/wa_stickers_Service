// app.js
require('dotenv').config();
// const dns = require('dns');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./lib/config/swagger');
const stickerRoutes = require('./lib/routes/stickers');

// dns.setServers(['8.8.8.8', '8.8.4.4']);
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(express.json());

// No local static file serving — Supabase Storage serves the actual
// sticker/tray bytes directly from its own public URL now.

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api', stickerRoutes);

app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(process.env.PORT || 3000, () =>
  console.log(`Server running — docs at http://localhost:${process.env.PORT || 3000}/api-docs`)
);