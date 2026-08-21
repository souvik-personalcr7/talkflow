import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message || err);

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    // Do not expose stack traces in production
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
};
