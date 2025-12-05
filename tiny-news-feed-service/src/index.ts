import express from 'express';
import 'reflect-metadata';
import { initiateConnection } from './utils/database';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initiateConnection();
});