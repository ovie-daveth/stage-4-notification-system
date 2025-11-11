const axios = require('axios');

const buildHttpClient = ({ baseURL, timeout }) =>
  axios.create({
    baseURL,
    timeout,
  });

module.exports = buildHttpClient;

