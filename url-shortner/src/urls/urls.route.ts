
import {Router} from 'express';
import {createShortUrl, getAllUrls ,redirectToLongUrl} from './urls.controller';

const router = Router();


router.get('/:shortCode', redirectToLongUrl);

router.get('/urls', getAllUrls);

router.post('/urls', createShortUrl);



export default router;