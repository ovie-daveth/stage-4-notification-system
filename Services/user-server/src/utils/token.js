const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (payload) => {
  return jwt.sign(payload, config.auth.jwt_secret, {
    expiresIn: config.auth.jwt_expires_in,
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, config.auth.jwt_secret);
};

module.exports = {
  generateToken,
  verifyToken,
};

