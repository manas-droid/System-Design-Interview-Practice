import { Request, Response } from "express";
import { Server } from "socket.io";
import { IMessageService, MessagePerRoomResponse, PSQLMessageService } from "./message.service";


const messageService : IMessageService = new PSQLMessageService();

interface MessageRequest{
    sender:string,
    content:string,
    roomId:string | null,
    receiver: string
}

export const sendMessageController = async (req:Request, res:Response, io:Server)=>{
    const messageReq:MessageRequest = req.body;
    const {sender, content, roomId, receiver} = messageReq;
   
    if (!sender || !content) {
      return res.status(400).send({ error: 'Sender and content are required.' });
    }


    const messageResponse = await messageService.addDirectMessage(sender, receiver, content ,roomId);
    
    io.to(messageResponse.roomId).emit("receive_message", content);
    res.status(201).send({delivered:true ,status: 'Message sent'});
}



export const getMessagesPerRoomController = async (req:Request, res:Response) =>{
    const roomId:string = req.params.roomId;
    console.log(roomId, req.params);
    const messagePerRoomResponse:MessagePerRoomResponse[] = await messageService.getMessagesForUserWithRoomID(roomId);
    res.status(200).json(messagePerRoomResponse);
}