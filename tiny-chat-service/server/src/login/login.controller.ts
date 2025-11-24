import { Request, Response } from "express";
import { IUserService, PSQLUserService } from "../user/user.service";
import { UserResponse } from "../user/user.response";



const userService:IUserService = new PSQLUserService();


export const loginController = async (req:Request, res:Response)=>{
    const {email} = req.body;

    const userResponse : UserResponse = (await userService.getUserDetailsIfExists(email) || await userService.addNewUser(email) );
    
    res.status(200).json(userResponse)
}





/*

A user can be part of multiple chat rooms
A chat room (as of now) has only 2 users


*/