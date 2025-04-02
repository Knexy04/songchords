import express from 'express';
import cors from 'cors';
import path from 'path';
import { parseEnvs } from './config/env';
import { connectMongo } from './config/database';
import chordRoutes from './routes/chordRoutes';
import authorRoutes from './routes/authorRoutes';
import songRoutes from './routes/songRoutes';
import songchordRoutes from './routes/songchordRoutes';
import { notFound, errorHandler } from './middleware/errorMiddleware';

const { PORT } = parseEnvs();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Статические файлы
app.use('/api/static', express.static(path.join(__dirname, '../public')));

// Маршруты
app.use('/api/chords', chordRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/songchords', songchordRoutes);

// Корневой маршрут
app.get('/', (req, res) => {
  res.json({ message: 'SongChord API сервер работает' });
});

// Middleware для обработки ошибок
app.use(notFound);
app.use(errorHandler);

// Подключение к базе данных и запуск сервера
const startServer = async () => {
  try {
    await connectMongo();
    
    app.listen(PORT, () => {
      console.log(`✅ Сервер запущен на порту ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Ошибка при запуске сервера:', error);
    process.exit(1);
  }
};

startServer(); 