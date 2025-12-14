import { Router } from "express";
import { feedController } from "./feed.controller";


const router = Router();



router.get('/', feedController);


export default router;