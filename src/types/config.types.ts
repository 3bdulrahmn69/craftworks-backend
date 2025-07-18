export interface IConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  jwtExpiration: string;
  nodeEnv: string;
  rateLimitWindow: number;
  rateLimit: number;
}

export interface IDatabaseConfig {
  uri: string;
  options: {
    retryWrites: boolean;
    w: string;
  };
}

export interface IAuthConfig {
  jwtSecret: string;
  jwtExpiration: string;
  bcryptSaltRounds: number;
}

export interface IRateLimitConfig {
  windowMs: number;
  max: number;
  message: {
    message: string;
  };
  standardHeaders: boolean;
  legacyHeaders: boolean;
}
