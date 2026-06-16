const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./database/config.js');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const userRouter = require('./backend/routes/userRoutes.js');
const feedRouter = require('./backend/routes/feedRoutes.js');
const messagingRouter = require('./backend/routes/messagingRoutes.js');
const groupsRouter = require('./backend/routes/groupsRoutes.js');
const marketplaceRouter = require('./backend/routes/marketplaceRoutes.js');
const notificationsRouter = require('./backend/routes/notificationsRoutes.js');

app.use('/api/users', userRouter);
app.use('/api/feed', feedRouter);
app.use('/api/messaging', messagingRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/marketplace', marketplaceRouter);
app.use('/api/notifications', notificationsRouter);

app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  const status = error.status || 500;
  const message = error.message || 'Internal Server Error';
  res.status(status).json({
    error: {
      message: message,
      status: status,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();