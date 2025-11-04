import { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const proxy = (req: Request, res: Response, target: string): Promise<void> => {
  // Proxy logic here
  const proxyMiddleware =  createProxyMiddleware({
    target: target,
    changeOrigin: true,
  });

  return proxyMiddleware(req, res);
};

export default proxy;