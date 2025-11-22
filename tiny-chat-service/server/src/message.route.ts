import { Express, Request, Response } from "express";
import { Server } from "socket.io";


interface Message{
    sender:string,
    content:string,
    roomId:string,
    timestamp:string
}


export const messageRouter = (app:Express, io:Server) =>{
    app.post('/api/message', (req:Request, res: Response)=>{
        sendMessageController(req, res, io);
    });
}



const sendMessageController = (req:Request, res:Response, io:Server)=>{
    const messageReq:Message = req.body;
    const {sender, content, roomId} = messageReq;
   
    if (!sender || !content || !roomId) {
      return res.status(400).send({ error: 'Sender and content are required.' });
    }


    const message = {
        sender,
        roomId,
        content,
        timestamp: new Date().toISOString()
    }

    io.to(roomId).emit("receive_message", message);
    
    console.log(`Message received via POST from ${sender}: "${content}"`);
    res.status(201).send({delivered:true ,status: 'Message sent'});
}