import { Request, Response } from "express";
import { IUserService, PSQLUserService } from "./user.service";



const userService:IUserService = new PSQLUserService();

export const userController = async (_:Request, res:Response)=>{

    const userResponse = await userService.getAllUsers();


    return res.status(200).json(userResponse);
}