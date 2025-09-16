import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { log as structuredLog } from "./utils/logger";

const app = express();

// Configure trust proxy for rate limiting in Replit environment
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Comprehensive error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as any).requestId;
    
    // Determine appropriate status code
    let status = 500;
    let message = "Internal Server Error";
    let isOperational = false;

    if (err.status || err.statusCode) {
      // Express validation errors, HTTP errors
      status = err.status || err.statusCode;
      message = err.message || message;
      isOperational = status < 500;
    } else if (err.code) {
      // Database/system errors
      switch (err.code) {
        case '23505': // Unique violation
          status = 409;
          message = "Resource already exists";
          isOperational = true;
          break;
        case '23503': // Foreign key violation
          status = 400;
          message = "Invalid reference";
          isOperational = true;
          break;
        case '23502': // Not null violation
          status = 400;
          message = "Missing required field";
          isOperational = true;
          break;
        case '42P01': // Table does not exist
        case '42703': // Column does not exist
          status = 500;
          message = "Database configuration error";
          isOperational = false;
          break;
        default:
          message = err.message || message;
          isOperational = false;
      }
    } else if (err.name === 'ValidationError' || err.name === 'ZodError') {
      // Validation errors
      status = 400;
      message = "Invalid input data";
      isOperational = true;
    } else if (err.name === 'UnauthorizedError' || err.message?.includes('auth')) {
      status = 401;
      message = "Authentication required";
      isOperational = true;
    } else if (err.name === 'ForbiddenError' || err.message?.includes('forbidden')) {
      status = 403;
      message = "Access denied";
      isOperational = true;
    } else if (err.message) {
      message = err.message;
    }

    // Log error with appropriate level and context
    const errorContext = {
      err: err,
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      status,
      isOperational
    };

    if (isOperational && status < 500) {
      // Client errors (4xx) - log as warning
      structuredLog.warn("Client error", errorContext);
    } else {
      // Server errors (5xx) or unexpected errors - log as error
      structuredLog.error("Server error", errorContext);
    }

    // Send error response (only if response hasn't been sent)
    if (!res.headersSent) {
      res.status(status).json({
        message,
        ...(process.env.NODE_ENV === 'development' && !isOperational && {
          stack: err.stack,
          details: err.toString()
        })
      });
    }

    // Don't re-throw errors - this prevents uncaught exceptions
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
