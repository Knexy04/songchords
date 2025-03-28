import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export function parseEnvs() {
  return {
    TOKEN: process.env.TOKEN || '',
    API_URL: process.env.API_URL || 'http://localhost:3000/api',
  };
} 