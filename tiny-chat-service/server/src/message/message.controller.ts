import { Request, Response } from "express";
import { Server } from "socket.io";
import { DirectMessageResult, IMessageService, MessageDeliveryResponse, MessagePerRoomResponse, PSQLMessageService, RoomDeliveryResponse } from "./message.service";


const messageService : IMessageService = new PSQLMessageService();

interface MessageRequest{
    sender:string,
    content:string,
    roomId:string | null,
    receiver: string
}

const getUserChannel = (userId: string) => `user:${userId}`;

export const sendMessageController = async (req:Request, res:Response, io:Server)=>{
    const messageReq:MessageRequest = req.body;
    const {sender, content, roomId, receiver} = messageReq;
   
    if (!sender || !content) {
      return res.status(400).send({ error: 'Sender and content are required.' });
    }


    const delivery:DirectMessageResult = await messageService.addDirectMessage(sender, receiver, content ,roomId);

    const socketPayload:MessageDeliveryResponse = delivery.message;
    const roomPayload:RoomDeliveryResponse | null = delivery.room;

    io.to(socketPayload.roomId).emit("message.created", socketPayload);

    if(delivery.isNewRoom && roomPayload){
        const roomEvent = { room: roomPayload, message: socketPayload };
        io.to(getUserChannel(sender)).emit("room.created", roomEvent);
        io.to(getUserChannel(receiver)).emit("room.created", roomEvent);
    }

    res.status(201).send({
        delivered:true,
        message: socketPayload,
        room: roomPayload,
        isNewRoom: delivery.isNewRoom
    });
}



export const getMessagesPerRoomController = async (req:Request, res:Response) =>{
    const roomId:string = req.params.roomId;
    const messagePerRoomResponse:MessagePerRoomResponse[] = await messageService.getMessagesForUserWithRoomID(roomId);
    res.status(200).json(messagePerRoomResponse);
}