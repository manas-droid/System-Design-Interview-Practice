import { Request, Response } from "express";
import { decodeAccessToken } from "../auth/authTokenService";
import { AuthError, AuthErrorCode } from "../auth/authErrors";
import { IUserService, UserService } from "../user/user.service";
import { IPostService, PostRequest, PostResponse, PostService } from "./post.service";
import { User } from "../schemas/User";
import { pushPostDetailsToBroker } from "./post.kafka.producer";


const userService : IUserService = new UserService();

const postService : IPostService = new PostService();

export const postController = async (req:Request, res: Response) =>{
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined

  if (!token) {
    return res.status(401).json({ code: AuthErrorCode.InvalidAccessToken })
  }


  try {
    const payload = decodeAccessToken(token);

    const user : (User|null) = await userService.getUserIfExists(payload.sub);

    if(!user) {
        return res.status(404).json({code : AuthErrorCode.UserNotFound});
    }


    const postRequest : PostRequest = req.body;

    const postResponse : PostResponse = await postService.addPostByUser(user, postRequest);


    /**
     * Consumed in feed service
     */
    await pushPostDetailsToBroker(postResponse);

    res.status(201).json({
      message: 'Posted Successfully!'
    });

  } catch (error) {

    if (error instanceof AuthError) {
      return res.status(error.status).json({ code: error.code })
    }

    console.error('Failed to create post', error)
    return res.status(500).json({ code: 'POST_CREATION_FAILED' })
  }
}
