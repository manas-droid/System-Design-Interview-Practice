import { Repository } from "typeorm";
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



export interface IPostService {
    /**
     * returns the saved post id 
     */
    addPostByUser(user:User, postDetails : PostRequest) : Promise<PostResponse>;
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
        
        console.log("Post Service: Saved Post ",savedPost);

       return {
            id : savedPost.id,
            userId: user.id
       }
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