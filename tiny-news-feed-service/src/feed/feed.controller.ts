import { Request, Response } from "express";
import { FeedService, IFeedService } from "./feed.service";
import { AuthError, AuthErrorCode } from "../auth/authErrors";
import { decodeAccessToken } from "../auth/authTokenService";
import { IUserService, UserService } from "../user/user.service";


const userService : IUserService = new UserService();
const feedService : IFeedService = new FeedService();

export const feedController = async (req:Request, res:Response)=>{
    const authHeader = req.headers.authorization
    
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined

     const cursor : string | undefined = req.query['nextCursor'] as (string | undefined);

    if (!token) {
        return res.status(401).json({ code: AuthErrorCode.InvalidAccessToken })
    }

    try {

        const payload = decodeAccessToken(token);
        const doesUserExist:boolean = await userService.checkIfUserExists(payload.sub);
      
        if(!doesUserExist) {
            return res.status(404).json({code : AuthErrorCode.UserNotFound});
        }


        const postDetails = await feedService.getNewsTimeLineForUser(payload.sub, cursor ? (parseInt(cursor) ?  parseInt(cursor) : null ) : null);

        res.status(200).json(postDetails);

    } catch (error) {
        
        if (error instanceof AuthError) {
            return res.status(error.status).json({ code: error.code })
        }

        console.error('Failed to fetch Feed', error)

        return res.status(500).json({ code: 'FEED_FAILED_FETCH' })
    }

}