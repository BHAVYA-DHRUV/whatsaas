/**
 * Structured server-side logger
 * Provides consistent logging format across server-side code
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: number;
  teamId?: number;
  requestId?: string;
  route?: string;
  method?: string;
  duration?: number;
  [key: string]: any;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class ServerLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    const entry = this.formatMessage(level, message, context, error);

    // Structured console output
    const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    
    if (this.isDevelopment) {
      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || '', error || '');
    } else {
      // In production, output as JSON for log aggregation
      consoleMethod(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext) {
    this.log('error', message, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  withContext(additionalContext: LogContext): ServerLogger {
    const child = new ServerLogger();
    const originalLog = child.log.bind(child);
    
    child.log = (level: LogLevel, message: string, context?: LogContext, error?: Error) => {
      originalLog(level, message, { ...additionalContext, ...context }, error);
    };
    
    return child;
  }
}

// Singleton instance
export const logger = new ServerLogger();

// Request-scoped logger factory
export function createRequestLogger(requestId: string, route?: string, method?: string) {
  return logger.withContext({ requestId, route, method });
}
