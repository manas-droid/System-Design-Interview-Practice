import { RedisConstants } from "../utils/redis.const";
import { redisClient } from "./cache.redis";


export interface IFollowerCacheService {

    getFollowerCount(userId:string) : Promise<number|null>
    setFollowerCount(userId:string, followerCount: number) : Promise<void>

}


export class FollowerCacheService  implements IFollowerCacheService{

    generateFollowerCountKey(userId:string): string{
        return `user:${userId}`;
    }
    
    async getFollowerCount(userId: string): Promise<number | null> {
        const followerCount =  await redisClient.hGet(this.generateFollowerCountKey(userId), RedisConstants.FOLLOWER_COUNT_FIELD);
        
        return followerCount ? parseInt(followerCount) : null;
    }

    async setFollowerCount(userId: string, followerCount : number): Promise<void> {
        await redisClient.hSet(this.generateFollowerCountKey(userId), RedisConstants.FOLLOWER_COUNT_FIELD, followerCount);
    }
    
}