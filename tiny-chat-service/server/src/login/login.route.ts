import {Router} from 'express'
import { loginController } from './login.controller';

const router = Router();



router.post("/auth/email", loginController);



export default router;