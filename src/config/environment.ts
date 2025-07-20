import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_EXPIRATION: string;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT: number;
  CORS_ORIGIN: string;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const validateEnvironment = (): EnvironmentConfig => {
  const errors: string[] = [];

  // Required environment variables
  const requiredVars = ['JWT_SECRET', 'MONGODB_URI'];
  for (const envVar of requiredVars) 
    if (!process.env[envVar]) 
      errors.push(`Missing required environment variable: ${envVar}`);
    
  

  // JWT Secret validation
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) 
    errors.push('JWT_SECRET must be at least 32 characters long');
  

  // MongoDB URI validation
  if (
    process.env.MONGODB_URI &&
    !process.env.MONGODB_URI.startsWith('mongodb')
  ) 
    errors.push('MONGODB_URI must be a valid MongoDB connection string');
  

  if (errors.length > 0) 
    throw new ConfigurationError(
      `Environment configuration is invalid:\n${errors.join('\n')}`
    );
  

  const nodeEnv = process.env.NODE_ENV as EnvironmentConfig['NODE_ENV'];
  const validNodeEnvs: EnvironmentConfig['NODE_ENV'][] = [
    'development',
    'production',
    'test',
  ];

  const logLevel = process.env.LOG_LEVEL as EnvironmentConfig['LOG_LEVEL'];
  const validLogLevels: EnvironmentConfig['LOG_LEVEL'][] = [
    'error',
    'warn',
    'info',
    'debug',
  ];

  return {
    NODE_ENV: validNodeEnvs.includes(nodeEnv) ? nodeEnv : 'development',
    PORT: parseInt(process.env.PORT ?? '5000', 10),
    MONGODB_URI: process.env.MONGODB_URI!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRATION: process.env.JWT_EXPIRATION ?? '7d',
    RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW ?? '900000', 10),
    RATE_LIMIT: parseInt(process.env.RATE_LIMIT ?? '100', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
    LOG_LEVEL: validLogLevels.includes(logLevel) ? logLevel : 'info',
  };
};

export const env = validateEnvironment();

// Export individual configurations
export const serverConfig = {
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  corsOrigin: env.CORS_ORIGIN,
  logLevel: env.LOG_LEVEL,
} as const;

export const databaseConfig = {
  uri: env.MONGODB_URI,
  options: {
    retryWrites: true,
    w: 'majority' as const,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  },
} as const;

export const authConfig = {
  jwtSecret: env.JWT_SECRET,
  jwtExpiration: env.JWT_EXPIRATION,
  bcryptSaltRounds: 12,
} as const;

export const rateLimitConfig = {
  windowMs: env.RATE_LIMIT_WINDOW,
  max: env.RATE_LIMIT,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
} as const;

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Legacy export for backwards compatibility
export const config = {
  port: env.PORT,
  mongodbUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  jwtExpiration: env.JWT_EXPIRATION,
  nodeEnv: env.NODE_ENV,
  rateLimitWindow: env.RATE_LIMIT_WINDOW,
  rateLimit: env.RATE_LIMIT,
} as const;
