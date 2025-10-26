
import {Request, Response} from 'express';


export async function createShortUrl(req : Request, res:Response) {
  // Implementation for creating a short URL

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