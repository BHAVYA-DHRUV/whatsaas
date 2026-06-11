/**
 * Structured client-side logger
 * Provides consistent logging format across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: number;
  teamId?: number;
  chatId?: number;
  component?: string;
  action?: string;
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

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logQueue: LogEntry[] = [];
  private maxQueueSize = 50;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Flush logs periodically in production
      if (!this.isDevelopment) {
        this.flushInterval = setInterval(() => this.flush(), 10000);
      }

      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

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

    // Console output in development
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      consoleMethod(`[${level.toUpperCase()}]`, message, context || '', error || '');
    }

    // Queue for server logging in production
    if (!this.isDevelopment) {
      this.logQueue.push(entry);
      
      if (this.logQueue.length >= this.maxQueueSize) {
        this.flush();
      }
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
   * Flush queued logs to server
   */
  private async flush() {
    if (this.logQueue.length === 0) return;

    const logsToSend = [...this.logQueue];
    this.logQueue = [];

    try {
      await fetch('/api/logs/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: logsToSend }),
        keepalive: true,
      });
    } catch (err) {
      // If flush fails, add logs back to queue (up to max size)
      const spaceAvailable = this.maxQueueSize - this.logQueue.length;
      if (spaceAvailable > 0) {
        this.logQueue.unshift(...logsToSend.slice(0, spaceAvailable));
      }
    }
  }

  /**
   * Cleanup method to clear interval
   */
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flush();
  }
}

// Singleton instance
export const logger = new ClientLogger();

// Context helpers
export function withComponent(component: string) {
  return (context: LogContext = {}) => ({ ...context, component });
}

export function withUser(userId: number) {
  return (context: LogContext = {}) => ({ ...context, userId });
}

export function withTeam(teamId: number) {
  return (context: LogContext = {}) => ({ ...context, teamId });
}
