import { Repository } from "typeorm";
import { User } from "../schemas/User";
import PostgreSQLDatasource from "../utils/database";
import { FollowerCacheService, IFollowerCacheService } from "../cache/follower.cache.service";
import { Follower } from "../schemas/Follower";

export interface IUserService {
    getUserIfExists(userId:string) : Promise<User|null>;
    isUserACelebrity(userId:string) : Promise<Boolean>;
    getFollowersForUserId(userId:string): Promise<Array<FollowerResponse>>;
}


export interface FollowerResponse {
    followerId:string
}


export class UserService implements IUserService {

    private readonly userRepository:Repository<User>;
    private readonly followerCacheService : IFollowerCacheService;
    private readonly followerRepository: Repository<Follower>;

    private readonly HOT_USER_THRESHOLD:number = 1000;

    constructor(){
        this.userRepository = PostgreSQLDatasource.getRepository(User);
        this.followerCacheService = new FollowerCacheService();
        this.followerRepository = PostgreSQLDatasource.getRepository(Follower);
    }
    /**
     * Only used internally. does not directly interact with public API
     */
    async getUserIfExists(userId: string): Promise<User|null> {

        return await this.userRepository.findOne({where : {id : userId}});
    }


    async isUserACelebrity(userId: string): Promise<Boolean> {
        
        let followerCount: (number | null) = await this.followerCacheService.getFollowerCount(userId);

        if(!followerCount) {
            followerCount = await this.followerRepository.countBy({ followee : {id : userId} });
            console.log(`Follower Count of ${userId} is ${followerCount}`);
            await this.followerCacheService.setFollowerCount(userId, followerCount);
        }

        return followerCount >= this.HOT_USER_THRESHOLD;
    }

    async getFollowersForUserId(userId: string): Promise<Array<FollowerResponse>> {
        const followerResponse = await this.followerRepository.find({where: {
            followee : {
                id : userId
            }
        }, 
        
        select : {
            followee: {
                id : true
            }
        }
        });

        return followerResponse.map((f)=>{
            return {
                followerId: f.followee.id
            }
        })
    }

}
