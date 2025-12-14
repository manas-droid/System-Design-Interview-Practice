import { PostResponse } from "../post/post.service"




export const stringToPostConsumerResponse = (value : string):PostResponse=>{
    try {
        return JSON.parse(value) as PostResponse;
    } catch (error ) {
        throw new Error(`Failed to pass string: ${value} to JSON. Error Message: ${(error as Error).message}`);
    }
} 