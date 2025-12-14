import {createClient} from 'redis';



export const redisClient = createClient({
    url : 'redis://localhost:6379',
})


redisClient.on('error', (err)=>{
    console.error("Redis Client Error", err);
});

export const initRedisClient = async ()=>{
    await redisClient.connect();
}


export const shutDownRedisClient = async ()=>{
    await redisClient.close();
}