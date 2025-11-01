
import {Router} from 'express';
import {createShortUrl, getAllUrls ,redirectToLongUrl} from './urls.controller';
import { validateCreateUrl } from '../middleware/validation';

const router = Router();

router.get('/urls/:shortCode', redirectToLongUrl);
router.get('/urls', getAllUrls);
router.post('/urls', validateCreateUrl, createShortUrl);



export default router;