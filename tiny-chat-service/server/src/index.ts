import express from 'express';
import 'reflect-metadata';
import {Server, Socket} from "socket.io"
import http from 'http';
import { messageRouter } from './message/message.route';
import cors from 'cors'
import { initiateConnection } from './utils/Database';
import loginRouter from './login/login.route'
import userRouter from './user/user.router';
import roomRouter from './room/room.router';
import { addDummyUsers } from './user/dummy/users.dummy';


const app = express();
const PORT = process.env.PORT || 8081;

const server = http.createServer(app)

const CLIENT_ORIGIN = 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN, 
    methods: ['GET', 'POST'],
    credentials: true 
  }
});

const getUserChannel = (userId: string) => `user:${userId}`;


io.on("connection", (socket:Socket)=>{
  socket.on('identify_user', (userId:string)=>{
    if(!userId){
      return;
    }
    socket.join(getUserChannel(userId));
    socket.data.userId = userId;
  });
  socket.on('join_room', (roomId:string)=>{
    socket.join(roomId)
  });
  
  console.log("Connection Established", socket.id);
})

app.use(express.json());
app.use(cors());

messageRouter(app, io);


app.use('/api',loginRouter)

app.use('/api', userRouter);
app.use('/api', roomRouter);
app.get('/', (req, res) => { res.json({ message: 'Hello World!' }); });



server.listen(PORT, async () => {
  await initiateConnection();
  await addDummyUsers();
  console.log(`Server running on port ${PORT}`);
});
