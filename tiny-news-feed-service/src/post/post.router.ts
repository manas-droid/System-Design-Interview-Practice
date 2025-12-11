import { Router } from "express";
import { postController } from "./post.controller";


const router = Router();


router.post('/post' , postController)