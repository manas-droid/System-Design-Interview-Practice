import { api } from "../lib/api"



export const postService = async (content: string) =>{
 const response =   await api.post('/post', {content});

 console.log(response);
}