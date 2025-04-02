import mongoose from 'mongoose';
import { parseEnvs } from './env';

const { MONGO_URL, DB_NAME } = parseEnvs();

export async function connectMongo() {
  try {
    await mongoose.connect(MONGO_URL, {
      dbName: DB_NAME,
    });

    console.log('✅ Подключено к MongoDB');
  } catch (err) {
    console.error('❌ Ошибка подключения к MongoDB:', err);
    process.exit(1);
  }
}

export async function disconnectMongo() {
  try {
    await mongoose.disconnect();
    console.log('✅ Отключено от MongoDB');
  } catch (err) {
    console.error('❌ Ошибка при отключении от MongoDB:', err);
  }
} 