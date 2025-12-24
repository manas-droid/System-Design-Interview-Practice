import express from 'express';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';
import { initiateConnection } from './utils/database';
import authRouter from './auth/authRoutes';
import postRouter from './post/post.router';
import feedRouter from './feed/feed.router';
import cors from 'cors';

import { appEnv } from './utils/env';
import { initPostServiceKafkaProducer, shutDownPostServiceProducer } from './post/post.kafka.producer';
import { initFanOutServiceConsumer, shutDownFanOutServiceConsumer } from './fan-out/fanout.kafka.consumer';
import { initRedisClient } from './cache/cache.redis';
import { startWebsocketServer } from './realtime/ws.hub';

const app = express();
const PORT = appEnv.server.port;


app.use(cors({
  origin : "http://localhost:5173",
  credentials:true
}))


app.use(express.json());
app.use(cookieParser());
app.use('/api/auth', authRouter);

app.use('/api/post', postRouter);
app.use('/api/feed', feedRouter);

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

  startWebsocketServer(server);

  const gracefulExit = async ()=>{
    server.close();
    await shutDownPostServiceProducer();
    await shutDownFanOutServiceConsumer();
    process.exit(0);
  };

  process.on("SIGINT", gracefulExit);
  process.on("SIGTERM", gracefulExit);
}


start();
