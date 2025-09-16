import pino from 'pino';
import pretty from 'pino-pretty';

// Configure logger based on environment
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

// Create the logger instance
export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
}, isDevelopment ? pretty({
  colorize: true,
  translateTime: 'HH:MM:ss.l',
  ignore: 'pid,hostname',
  messageFormat: '{msg}',
  customPrettifiers: {
    level: (level) => `[${String(level).toUpperCase()}]`
  }
}) : undefined);

// Type-safe logger interface
export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  err?: Error;
  [key: string]: any;
}

// Log rotation strategy for production
// In production environments, implement log rotation using:
// 1. PM2 with log rotation: pm2 logs --rotate
// 2. Logrotate with daily/weekly rotation based on size/time
// 3. External log management services (e.g., CloudWatch, Datadog)
// Current setup outputs to stdout/stderr for container/service log collection

// Convenience methods for common log operations
export const log = {
  info: (msg: string, context?: LogContext) => logger.info(context, msg),
  error: (msg: string, context?: LogContext) => logger.error(context, msg),
  warn: (msg: string, context?: LogContext) => logger.warn(context, msg),
  debug: (msg: string, context?: LogContext) => logger.debug(context, msg),
  
  // HTTP request logging
  request: (msg: string, context: LogContext) => logger.info({
    ...context,
    type: 'request'
  }, msg),
  
  // Authentication logging
  auth: (msg: string, context: LogContext) => logger.info({
    ...context,
    type: 'auth'
  }, msg),
  
  // WebSocket logging
  websocket: (msg: string, context: LogContext) => logger.info({
    ...context,
    type: 'websocket'
  }, msg),
  
  // Database logging
  database: (msg: string, context: LogContext) => logger.info({
    ...context,
    type: 'database'
  }, msg),
};