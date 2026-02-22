const mongoose = require('mongoose');

const getHealth = (req, res) => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const mongoState = stateMap[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    mongo: mongoState,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };
