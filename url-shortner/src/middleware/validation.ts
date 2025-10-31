import { Request, Response, NextFunction } from 'express';

export const validateCreateUrl = (req: Request, res: Response, next: NextFunction) => {
  const { actual_url } = req.body;
  
  console.log("Validating URL", actual_url);
  if (!actual_url) {
    return res.status(400).json({ error: 'Invalid request body. "actual_url" is required.' });
  }
  
  // Additional URL validation
  try {
    new URL(actual_url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }
  
  next();
};