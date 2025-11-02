
import {Router} from 'express';
import {createShortUrl, getAllUrls ,redirectToLongUrl} from './urls.controller';
import { validateCreateUrl } from '../middleware/validation';

const router = Router();

router.get('/:shortCode', redirectToLongUrl);
router.get('/api/urls', getAllUrls);
router.post('/api/urls', validateCreateUrl, createShortUrl);



export default router;