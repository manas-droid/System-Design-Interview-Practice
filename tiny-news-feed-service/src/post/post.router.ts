import { Request, Response, Router } from "express";
import { postController } from "./post.controller";


const router = Router();



router.post('/' , postController)

router.get('/', (_, res:Response)=>{
    res.status(200).json({
        message: 'Health Check: Post Service'
    })
})

export default router;