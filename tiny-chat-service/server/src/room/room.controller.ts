import { Request, Response } from "express";
import { IRoomService, PSQLRoomService, RoomResponse } from "./room.service";



const roomService: IRoomService = new PSQLRoomService();

export const getRoomsController = async (req:Request, res:Response) =>{

    const rooms:RoomResponse[] = await roomService.getRoomsForUser(req.query.userId as string);

    res.status(200).json({rooms});
}   