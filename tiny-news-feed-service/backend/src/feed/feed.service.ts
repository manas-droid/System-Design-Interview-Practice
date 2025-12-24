import { CachedFeedItem, IInboxCacheService, InboxCacheService } from "../cache/inbox.cache.service";
import { IPostService, PostDetailResponse, PostService } from "../post/post.service";
import { IUserService, UserService } from "../user/user.service";



export interface NewsTimeLineResponse {
    nextCursor: number|null
    posts : Array<PostDetailResponse>
}

export interface IFeedService {
    getNewsTimeLineForUser(userId:string, cursor:number|null): Promise<NewsTimeLineResponse>;
}



export class FeedService implements IFeedService {

    private readonly userService : IUserService;
    private readonly inboxCacheService : IInboxCacheService;
    private readonly NEWS_FEED_LIMIT:number = 10;
    private readonly postService : IPostService ;


    constructor(){
        this.userService = new UserService();
        this.inboxCacheService = new InboxCacheService();
        this.postService = new PostService();
    }
    
    async getNewsTimeLineForUser(userId: string, cursor:number|null): Promise<NewsTimeLineResponse> {
        const start = performance.now();
        
        const celebrities:Array<string> = await this.userService.getCelebritiesFollowedByUser(userId);

        const celebrityPostIds : Array<CachedFeedItem> = await this.inboxCacheService.getInboxesOfCelebritiesPipelined(celebrities, 3, cursor);
        const normalPostIds : Array<CachedFeedItem> = await this.inboxCacheService.getInboxOfUser(userId, 7, cursor);


        // Merge and de-duplicate by post ID while keeping the latest score
        const mergedMap = new Map<string, CachedFeedItem>();
        for (const item of [...celebrityPostIds, ...normalPostIds]) {
            const existing = mergedMap.get(item.value);
            if (!existing || item.score > existing.score) {
                mergedMap.set(item.value, item);
            }
        }

        const mergedPostIds = Array.from(mergedMap.values());
        mergedPostIds.sort((a,b)=>b.score - a.score);

        const topFeedItems = mergedPostIds.slice(0, this.NEWS_FEED_LIMIT);

        const nextCursor: (number | null) = topFeedItems.length == 0 ? null : topFeedItems[topFeedItems.length - 1].score;

        const posts = await this.postService.getPostDetailsByIds(topFeedItems.map((feed)=>feed.value));

        const end = performance.now();


        console.log(`Time Take to fetch News service: ${end - start} ms`);

        return {
            nextCursor,
            posts
        };
    }
    
}
