const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/config');
const connectDB = require('./config/db');
require("dotenv").config();

// Initialize database
connectDB();

const app = express();

// Middleware
app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory for uploaded reports
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedInsight Backend',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Root welcome
app.get('/', (req, res) => {
  res.json({
    message: 'MedInsight AI Backend API is running',
    version: '1.0.0',
  });
});

// Mount API Routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const analysisRoutes = require('./routes/analysisRoutes');
const historyRoutes = require('./routes/historyRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reports', analysisRoutes);
app.use('/api/history', historyRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start listening
const server = app.listen(config.port, () => {
  console.log(`[MedInsight Backend] Server running on port ${config.port} (${config.nodeEnv})`);
});

module.exports = { app, server };
