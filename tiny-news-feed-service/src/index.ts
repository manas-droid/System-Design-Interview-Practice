import express from 'express';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import { initiateConnection } from './utils/database';
import authRouter from './auth/authRoutes';
import { appEnv } from './utils/env';

const app = express();
const PORT = appEnv.server.port;

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initiateConnection();
});
