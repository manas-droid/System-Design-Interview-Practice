import { Repository } from "typeorm";
import { User } from "../schemas/User";
import PostgreSQLDatasource from "../utils/database";
import { FollowerCacheService, IFollowerCacheService } from "../cache/follower.cache.service";
import { Follower } from "../schemas/Follower";

export interface IUserService {
    getUserIfExists(userId:string) : Promise<User|null>;
    isUserACelebrity(userId:string) : Promise<Boolean>;
    getFollowersForUserId(userId:string): Promise<Array<FollowerResponse>>;
    getCelebritiesFollowedByUser(userId:string) : Promise<Array<string>>;
    checkIfUserExists(userId:string): Promise<boolean>
}

export interface FollowerResponse {
    id:string
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
            follower: {
                id : true
            }
        },
        relations: {
            follower: true
        }
        });


        return followerResponse.map((f)=>{
            return {
                id: f.follower.id
            }
        })
    }


    async getCelebritiesFollowedByUser(userId: string): Promise<Array<string>> {
        
        
        
        const hotUsersSubQuery = this.followerRepository
            .createQueryBuilder("f2")
            .select('f2."followeeId"', "followeeId") // **NOTE: Quoting is critical here**
            .groupBy('f2."followeeId"')
            .having("COUNT(f2.\"followerId\") >= :threshold", { threshold: this.HOT_USER_THRESHOLD });

        // --- 2. Define the Main Query (f1) and JOIN ---
        const followedHotUsers = await this.followerRepository
            .createQueryBuilder("f1")
            // SELECT: Reference the column name with quotes to match the DB
            .select('f1."followeeId"', "hotUserId")
            
            // JOIN: Pass the raw SQL query for the subquery
            // Use the ALIAS 'HotUsers' in the condition string explicitly.
            .innerJoin(
                `(${hotUsersSubQuery.getQuery()})`, 
                "HotUsers", 
                'f1."followeeId" = "HotUsers"."followeeId"' // **FIX: Reference the subquery alias (HotUsers) explicitly with quotes**
            )
            // Set the parameters for the inner query (HotUsers)
            .setParameters(hotUsersSubQuery.getParameters())
            
            // WHERE: Filter down to the user requesting the feed
            .where('f1."followerId" = :userId', { userId: userId })
            
            // EXECUTION: Get the raw results
            .getRawMany();        // TypeORM returns an array of objects ({ hotUserId: 123 }). 
        // We map this to a flat array of numbers.
        
        return followedHotUsers.map(result => result.hotUserId);
                
    }



    async checkIfUserExists(userId:string): Promise<boolean>{
        return await this.userRepository.existsBy({id: userId});
    }


}
