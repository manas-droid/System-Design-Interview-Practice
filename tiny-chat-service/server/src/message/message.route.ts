import { Express, Request, Response } from "express";
import { Server } from "socket.io";
import { IMessageService, PSQLMessageService } from "./message.service";


interface Message{
    sender:string,
    content:string,
    roomId:string | null,
    receiver: string
}


export const messageRouter = (app:Express, io:Server) =>{
    app.post('/api/dm', async (req:Request, res: Response)=>{
        await sendMessageController(req, res, io);
    });
}


const messageService : IMessageService = new PSQLMessageService();


const sendMessageController = async (req:Request, res:Response, io:Server)=>{
    const messageReq:Message = req.body;
    const {sender, content, roomId, receiver} = messageReq;
   
    if (!sender || !content) {
      return res.status(400).send({ error: 'Sender and content are required.' });
    }


    const messageResponse = await messageService.addDirectMessage(sender, receiver, content ,roomId);

    
    io.to(messageResponse.roomId).emit("receive_message", content);
    console.log(`Message received via POST from ${sender}: "${content}"`);
    res.status(201).send({delivered:true ,status: 'Message sent'});
}