import express from 'express';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import { initiateConnection } from './utils/database';
import authRouter from './auth/authRoutes';
import postRouter from './post/post.router';
import { appEnv } from './utils/env';
import { initPostServiceKafkaProducer, shutDownPostServiceProducer } from './post/post.kafka.producer';
import { initFanOutServiceConsumer, shutDownFanOutServiceConsumer } from './fan-out/fanout.kafka.consumer';
import { initRedisClient, shutDownRedisClient } from './cache/cache.redis';

const app = express();
const PORT = appEnv.server.port;

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRouter);

app.use('/api/post', postRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});


const start = async ()=>{

  await initiateConnection();
  await initPostServiceKafkaProducer()
  await initFanOutServiceConsumer();
  await initRedisClient();

  const server = app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
  });

  const gracefulExit = async ()=>{
    server.close();
    await shutDownPostServiceProducer();
    await shutDownFanOutServiceConsumer();
    await shutDownRedisClient();
    process.exit(0);
  };

  process.on("SIGINT", gracefulExit);
  process.on("SIGTERM", gracefulExit);
}


start();
