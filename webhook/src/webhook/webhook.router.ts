import {Router} from 'express';
import {registryController} from './webhook.controller';

const router = Router()



router.post('/register', registryController);


export default router;