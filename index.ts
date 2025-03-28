import { initBot } from './src/bot/bot';
import axios from 'axios';
import { parseEnvs } from './src/config/env';

const { API_URL } = parseEnvs();

// Проверка доступности API перед запуском бота
async function checkApiAndStartBot() {
  try {
    // Пытаемся отправить запрос к API
    initBot();
  } catch (error) {
    console.error('❌ API не доступен! Убедитесь, что API сервер запущен по адресу', API_URL);
    console.log('Запустите API сервер командой: cd songchord-api && npm run dev');
    process.exit(1);
  }
}

checkApiAndStartBot();