import { PostResponse } from "../post/post.service";
import { FollowerResponse, IUserService, UserService } from "../user/user.service";
import { IInboxCacheService, InboxCacheService } from "../cache/inbox.cache.service";

export interface IFanOutService {
    publishPostByUser(postResponse: PostResponse) : Promise<void>;
}



export class FanOutService implements IFanOutService {

    private readonly userService : IUserService;
    private readonly inboxCacheService: IInboxCacheService;
    constructor (){
        this.userService = new UserService();
        this.inboxCacheService = new InboxCacheService();
    }

    async publishPostByUser(postResponse: PostResponse): Promise<void> {
        const isUserACelebrity: Boolean = await this.userService.isUserACelebrity(postResponse.userId);
        
        // for celebrities
        if(isUserACelebrity) {
            await this.inboxCacheService.publishPostToHotUserInbox(postResponse);
            return;
        }

        // normal user
        const followersOfAuthor: Array<FollowerResponse>  = await this.userService.getFollowersForUserId(postResponse.userId);

        await this.inboxCacheService.fanoutPostToFollowerInboxesPipelined(postResponse, followersOfAuthor);

        console.log("Fan out Write Service Successful!");
    }

}