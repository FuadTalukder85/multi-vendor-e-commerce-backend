type LogLevel = "info" | "warn" | "error" | "debug";

interface Logger {
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

const formatMessage = (level: LogLevel, message: string): string => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

export const logger: Logger = {
  info(message: string, ...args: unknown[]) {
    console.log(formatMessage("info", message), ...args);
  },

  warn(message: string, ...args: unknown[]) {
    console.warn(formatMessage("warn", message), ...args);
  },

  error(message: string, ...args: unknown[]) {
    console.error(formatMessage("error", message), ...args);
  },

  debug(message: string, ...args: unknown[]) {
    if (process.env.NODE_ENV === "development") {
      console.debug(formatMessage("debug", message), ...args);
    }
  },
};
