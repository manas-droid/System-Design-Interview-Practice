
import {Request, Response} from 'express';
import { IURLDBService, URLDBService } from '../service/URLDBService';
import UrlShortenerService from '../service/UrlShortenerService';
import { SqliteUrlModel } from '../database/models';
import { UrlRecord } from '../database/models.interface';

/*
  To create a short URL 
  the user should add the long URL in the request body
  {
    "actual_url": "https://www.example.com/some/long/url"
  }
  
  Databases
  url_clicks:
    1. id (PK)
    2. short_code (unique)
    3. original_url
    4. click_count (optional - for cached counter)
    5. created_at
    
  click_analytics:
    id (PK)
    short_code (FK to urls.short_code)
    clicked_at (timestamp)
    user_agent

*/

interface CreateUrlRequestBody {
  actual_url: string;
}


const urlDBService:IURLDBService = new URLDBService(new UrlShortenerService(), new SqliteUrlModel());

export async function createShortUrl(req : Request, res:Response) {
  const body: CreateUrlRequestBody = req.body;

  try {
    urlDBService.createShortenedURL(body.actual_url);

  } catch (error) {
    return res.status(500).json({ message: 'Error creating short URL' });
  }

  return res.status(201).json({ message: 'Short URL created successfully' });
}


export async function getAllUrls(req : Request, res:Response) {
  // Implementation for getting all URLs   
  const allURLS: UrlRecord[] = await urlDBService.getAllURLs();
  
  return res.status(200).json({ message: 'List of all URLs' , data: allURLS});
}

export async function redirectToLongUrl(req : Request, res:Response) {
  // Implementation for redirecting to the long URL
  const shortCode: string = req.params.shortCode;
  const userAgent: (string | undefined) = req.headers['user-agent'];
  try{
    const longURL : string = await urlDBService.getLongURL(shortCode, userAgent);
    return res.redirect(longURL);
  } catch(error){
    return res.status(500).json({message: (error as Error).message});
  }
}