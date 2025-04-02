import dotenv from 'dotenv';

dotenv.config();

export interface EnvVars {
  PORT: number;
  MONGO_URL: string;
  DB_NAME: string;
}

export function parseEnvs(): EnvVars {
  return {
    PORT: Number(process.env.PORT) || 3000,
    MONGO_URL: process.env.MONGO_URL || '',
    DB_NAME: process.env.DB_NAME || 'songs',
  };
} 