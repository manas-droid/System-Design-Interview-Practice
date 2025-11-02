
import {Router} from 'express';
import {createShortUrl, getAllUrls ,redirectToLongUrl} from './url.controller';
import { validateCreateUrl, validateShortCode } from '../middleware/validation';

const router = Router();

router.get('/:shortCode', validateShortCode,redirectToLongUrl);
router.get('/api/urls', getAllUrls);
router.post('/api/urls', validateCreateUrl, createShortUrl);



export default router;