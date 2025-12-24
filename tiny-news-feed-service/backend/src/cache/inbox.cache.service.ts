import { PostResponse } from "../post/post.service";
import { FollowerResponse } from "../user/user.service";
import { redisClient } from "./cache.redis";


export interface IInboxCacheService {
    publishPostToHotUserInbox(postResponse: PostResponse) : Promise<void>;
    fanoutPostToFollowerInboxesPipelined(postResponse:PostResponse, followerIds:Array<FollowerResponse>) : Promise<void>
    getInboxesOfCelebritiesPipelined(celebrityUserIds:Array<string>, limit:number, cursor:(number|null)):Promise<Array<CachedFeedItem>>;
    getInboxOfUser(userId:string, limit:number, cursor:(number|null)) : Promise<Array<CachedFeedItem>>;
}


export interface CachedFeedItem {
    value:string,
    score:number
}

export class InboxCacheService implements IInboxCacheService {
    private readonly INBOX_LIMIT = 500;

    generateCelebrityInboxKey(userId:string){
        return `inbox:celebrity:public:${userId}`
    }

    
    // could be of celebrities or normal users

    generateInboxKey(userId:string):string{
        return `inbox:private:${userId}`;
    }

    async publishPostToHotUserInbox(postResponse: PostResponse): Promise<void> {
        const userId:string = postResponse.userId;

        try {

            const publicInboxKey:string = this.generateCelebrityInboxKey(userId);

            const privateInboxKey: string = this.generateInboxKey(userId);

            await redisClient.zAdd(publicInboxKey, {
                score: Date.now(),
                value: postResponse.id
            });
            

            await redisClient.zAdd(privateInboxKey, {
                score: Date.now(),
                value: postResponse.id
            });
            

            await redisClient.zRemRangeByRank(publicInboxKey,0, -(this.INBOX_LIMIT+1));

            await redisClient.zRemRangeByRank(privateInboxKey,0, -(this.INBOX_LIMIT+1));

        } catch (error) {
            console.error(`Error updating ZSET inbox for user ${userId}:`, error);            
        }
    }

    async fanoutPostToFollowerInboxesPipelined(postResponse: PostResponse, followerIds: Array<FollowerResponse>): Promise<void> {
        const pipeline = redisClient.multi();

        for(const follower of followerIds) {
            const key: string = this.generateInboxKey(follower.id);
            pipeline.zAdd(key, {
                score: Date.now(),
                value: postResponse.id
            });
            pipeline.zRemRangeByRank(key,0, -(this.INBOX_LIMIT+1));
        }

        await pipeline.execAsPipeline();
    }

    async getInboxesOfCelebritiesPipelined( celebrityUserIds: Array<string>, limit : number, cursor:(number | null)): Promise<Array<CachedFeedItem>> {
        const pipeline = redisClient.multi();


        for (const celebrity of celebrityUserIds) {
            const inboxKey:string = this.generateCelebrityInboxKey(celebrity);

            pipeline.zRangeWithScores(
            inboxKey,
            cursor ?? '+inf',
            '-inf',
                { 
                REV: true,
                BY : 'SCORE',
                LIMIT : {offset:0, count:limit}
                }
            );
        }

        const batchResults:any = await pipeline.execAsPipeline();

        return (batchResults as CachedFeedItem[][]).flat();
    }


    async getInboxOfUser(userId: string, limit: number, cursor:(number|null)): Promise<Array<CachedFeedItem>> {
        const inboxKey:string = this.generateInboxKey(userId);
        
        return await redisClient.zRangeWithScores(inboxKey, cursor ?? '+inf', '-inf', {REV:true , BY:'SCORE', LIMIT : {offset:0, count:limit}});
    }


}