import { Repository } from "typeorm";
import { Post } from "../schemas/Post";
import PostgreSQLDatasource from "../utils/database";
import { User } from "../schemas/User";



export interface PostRequest {
    content  : string;
    photoURL ?: string;
}


export interface PostResponse {
    id : string
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
            photoURL: postDetails?.photoURL
        });

       const savedPost =  await this.postRepository.save(newPost);
        

       return {
            id : savedPost.id
       }
    }

}