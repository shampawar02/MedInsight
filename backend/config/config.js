require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/medinsight',
  jwtSecret: process.env.JWT_SECRET || 'medinsight_jwt_secret_dev_key_2026_secure',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  aiServiceInternalToken: process.env.AI_SERVICE_INTERNAL_TOKEN || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
