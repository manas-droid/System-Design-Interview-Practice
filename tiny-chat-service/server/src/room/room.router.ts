import { Router } from "express";
import { getRoomsController } from "./room.controller";

const router = Router()

router.get("/rooms", getRoomsController);


export default router