import {Router} from 'express';
import {registryController, triggerController} from './webhook.controller';

const router = Router()



router.post('/register', registryController);

router.post('/trigger', triggerController);


export default router;