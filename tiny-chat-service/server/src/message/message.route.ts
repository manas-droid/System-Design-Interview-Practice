import { Express, Request, Response } from "express";
import { Server } from "socket.io";
import { IMessageService, PSQLMessageService } from "./message.service";
import { sendMessageController, getMessagesPerRoomController } from "./message.controller";



export const messageRouter = (app:Express, io:Server) =>{
    app.post('/api/dm', async (req:Request, res: Response)=>{
        await sendMessageController(req, res, io);
    });

    app.get("/api/messages/:roomId", getMessagesPerRoomController);
}

