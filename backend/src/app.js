const express = require('express');
const helmet = require('helmet');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(requestLogger);
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => {
  const ready = require('mongoose').connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'starting', message: 'API is running', database: ready ? 'connected' : 'disconnected' });
});

module.exports = app;
