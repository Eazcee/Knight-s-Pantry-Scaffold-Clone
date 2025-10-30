require('dotenv').config();
const { expo } = require('./app.json');

console.log('API Key loaded:', !!process.env.EXPO_PUBLIC_GEMINI_API_KEY);

module.exports = {
  expo: {
    ...expo,
    extra: {
      EXPO_PUBLIC_GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    },
  },
};
