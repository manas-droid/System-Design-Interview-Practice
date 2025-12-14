import { Repository , In} from "typeorm";
import { Post } from "../schemas/Post";
import PostgreSQLDatasource from "../utils/database";
import { User } from "../schemas/User";



export interface PostRequest {
    content  : string;
    photoURL ?: string;
}


export interface PostResponse {
    id : string,
    userId:string
}



export interface PostDetailResponse {
    id:string,
    content:string,
    photoURL:string|null,
    user : {
        handle:string,
        id:string
    },
    createdAt:Date
}

export interface IPostService {
    /**
     * returns the saved post id 
     */
    addPostByUser(user:User, postDetails : PostRequest) : Promise<PostResponse>;

    getPostDetailsByIds(postIds:Array<string>) : Promise<Array<PostDetailResponse>>;
}




export class PostService implements IPostService {

    private readonly postRepository: Repository<Post>;
    constructor(){
        this.postRepository = PostgreSQLDatasource.getRepository(Post);
    }


    async addPostByUser(user:User, postDetails: PostRequest): Promise<PostResponse> {

        const newPost = this.postRepository.create({
            content : postDetails.content,
            photoURL: postDetails?.photoURL,
            user
        });

       const savedPost =  await this.postRepository.save(newPost);


       return {
            id : savedPost.id,
            userId: user.id
       }
    }

    async getPostDetailsByIds(postIds: Array<string>): Promise<Array<PostDetailResponse>> {
        
        if (postIds.length === 0) return [];

        const posts = await this.postRepository.find({
            where: {
            id: In(postIds),
            },
            relations: {
            user: true,
            },
            select: {
            id: true,
            content: true,
            createdAt: true,
            photoURL: true,
            user: {
                id: true,
                handle: true,
            },
            },
        });

        // Preserve feed order
        const postMap = new Map(posts.map(p => [p.id, p]));

        return postIds
            .map(id => postMap.get(id))
            .filter(Boolean)
            .map(post => ({
            id: post!.id,
            content: post!.content,
            createdAt: post!.createdAt,
            photoURL: post!.photoURL ?? null,
            user: {
                id: post!.user.id,
                handle: post!.user.handle,
            },
            }));

    }


    

}
/*

docker exec -it kafka kafka-topics \
  --create \
  --topic new_posts \
  --partitions 1 \
  --replication-factor 1 \
  --if-not-exists \
  --bootstrap-server kafka:29092

docker exec -it kafka kafka-topics \
  --list \
  --bootstrap-server kafka:29092



*/