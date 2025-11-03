import {Router} from 'express';
import { validateShortCode } from '../middleware/validation';
import { getAnalyticsByShortCode } from './analytics.controller';

const router = Router();



router.get('/url/:shortCode', validateShortCode, getAnalyticsByShortCode);





export default router;