import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { log } from '../utils/logger';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  req.requestId = randomUUID();
  req.startTime = Date.now();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function(body) {
    const duration = Date.now() - req.startTime;
    const logContext = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      // Add userId if available from session
      ...(req.session?.userId && { userId: req.session.userId })
    };
    
    // Structured logging with Pino
    log.request(
      `${logContext.method} ${logContext.url} ${logContext.statusCode} in ${logContext.duration}ms`,
      logContext
    );
    
    return originalSend.call(this, body);
  };
  
  next();
}