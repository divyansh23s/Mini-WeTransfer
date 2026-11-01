const express = require('express');
const helmet = require('helmet');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const linkRoutes = require('./routes/linkRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const requestLogger = require('./middlewares/requestLogger');

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(requestLogger);
app.use(express.json({ limit: '32kb' }));
app.get('/health', (req, res) => {
  const ready = require('mongoose').connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'starting', message: 'API is running', database: ready ? 'connected' : 'disconnected' });
});
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/links', linkRoutes);
app.use(notFound);
app.use(errorHandler);
module.exports = app;
