import { Request, Response } from "express";
import { decodeAccessToken } from "../auth/authTokenService";
import { AuthError, AuthErrorCode } from "../auth/authErrors";
import { IUserService, UserService } from "../user/user.service";
import { IPostService, PostDetailResponse, PostRequest, PostResponse, PostService } from "./post.service";
import { User } from "../schemas/User";
import { pushPostDetailsToBroker } from "./post.kafka.producer";
import { WS_EVENTS, emitToUser, emitToUsersChunked } from "../realtime/ws.hub";


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

    // Websocket notifications: author sees immediately; followers see refresh notice
    try {
      const details: PostDetailResponse[] = await postService.getPostDetailsByIds([postResponse.id]);
      const fullPost = details[0];

      if (fullPost) {
        emitToUser(user.id, WS_EVENTS.POST_NEW, fullPost);
      }

      const followers = await userService.getFollowersForUserId(user.id);
      const followerIds = followers.map((f) => f.id).filter((id) => id !== user.id);

      const refreshNotice = {
        postId: postResponse.id,
        authorId: user.id,
        createdAt: (fullPost?.createdAt ?? new Date()).toISOString(),
      };

      void emitToUsersChunked(followerIds, WS_EVENTS.FEED_REFRESH_NEEDED, refreshNotice);
    } catch (emitError) {
      console.error("Failed to emit websocket notifications", emitError);
    }

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
