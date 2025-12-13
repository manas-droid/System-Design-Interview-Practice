import { PostResponse } from "../post/post.service";
import { FollowerResponse } from "../user/user.service";
import { redisClient } from "./cache.redis";


export interface IInboxCacheService {
    publishPostToHotUserInbox(postResponse: PostResponse) : Promise<void>;
    fanoutPostToFollowerInboxesPipelined(postResponse:PostResponse, followerIds:Array<FollowerResponse>) : Promise<void>
}


export class InboxCacheService implements IInboxCacheService {
    private readonly INBOX_LIMIT = 500;

    generateInboxKey(userId:string):string{
        return `inbox:${userId}`;
    }

    async publishPostToHotUserInbox(postResponse: PostResponse): Promise<void> {
        const userId:string = postResponse.userId;

        try {
            const key: string = this.generateInboxKey(userId);
            await redisClient.zAdd(key, {
                score: Date.now(),
                value: postResponse.id
            });
            await redisClient.zRemRangeByRank(key,0, -(this.INBOX_LIMIT+1));
            
            console.log(`ZSET Inbox updated for user ${userId}.`);

        } catch (error) {
            console.error(`Error updating ZSET inbox for user ${userId}:`, error);            
        }
    }

    async fanoutPostToFollowerInboxesPipelined(postResponse: PostResponse, followerIds: Array<FollowerResponse>): Promise<void> {
        const pipeline = redisClient.multi();

        for(const follower of followerIds) {
            const key: string = this.generateInboxKey(follower.followerId);
            pipeline.zAdd(key, {
                score: Date.now(),
                value: postResponse.id
            });
            pipeline.zRemRangeByRank(key,0, -(this.INBOX_LIMIT+1));
        }

        const response = await pipeline.execAsPipeline();
        console.log(`Published to normal followers response : ${response}`);
    }


}