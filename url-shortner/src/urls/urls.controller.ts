
import {Request, Response} from 'express';


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



export async function createShortUrl(req : Request, res:Response) {
  // Implementation for creating a short URL
  const { actual_url } = req.body;
  
  // Validation is now handled by middleware
  // Business logic goes here
  
  return res.status(201).json({ message: 'Short URL created successfully' });
}


export async function getAllUrls(req : Request, res:Response) {
  // Implementation for getting all URLs    
    return res.status(200).json({ message: 'List of all URLs' });
}

export async function redirectToLongUrl(req : Request, res:Response) {
  // Implementation for redirecting to the long URL

    return res.status(302).json({ message: 'Redirecting to long URL' });
}