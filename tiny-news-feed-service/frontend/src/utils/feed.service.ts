import { api } from "../lib/api"

export interface PostDetailResponse {
    id: string;
    content: string;
    photoURL: string | null;
    user: {
        handle: string;
        id: string;
    };
    createdAt: Date;
}


export interface FeedResponse {
    nextCursor:number | null,
    posts : PostDetailResponse[]
}

export const getFeedService = async ()=>{
    const feedResponse =  await api.get<FeedResponse>("/feed");

    return feedResponse.data;
}