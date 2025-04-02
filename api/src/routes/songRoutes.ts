import express from 'express';
import {
  getAllSongs,
  getSongById,
  getTracksByAuthor,
  getTracksByText,
  getTracksByName,
  getTracksByDto,
  createSong,
  updateSong,
  deleteSong
} from '../controllers/songController';

const router = express.Router();

// GET /api/songs - получить все песни
router.get('/', getAllSongs as express.RequestHandler);

// GET /api/songs/search/text - поиск песен по тексту
router.get('/search/text', getTracksByText as express.RequestHandler);

// GET /api/songs/search/name - поиск песен по названию
router.get('/search/name', getTracksByName as express.RequestHandler);

// GET /api/songs/search/dto - поиск песен по автору и названию
router.get('/search/dto', getTracksByDto as express.RequestHandler);

// GET /api/songs/author/:authorId - получить песни по автору
router.get('/author/:authorId', getTracksByAuthor as express.RequestHandler);

// GET /api/songs/:id - получить песню по ID
router.get('/:id', getSongById as express.RequestHandler);

// POST /api/songs - создать новую песню
router.post('/', createSong as express.RequestHandler);

// PUT /api/songs/:id - обновить песню
router.put('/:id', updateSong as express.RequestHandler);

// DELETE /api/songs/:id - удалить песню
router.delete('/:id', deleteSong as express.RequestHandler);

export default router; 