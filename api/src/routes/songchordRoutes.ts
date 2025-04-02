import express from 'express';
import {
  getAllSongchords,
  getSongchordById,
  getChordsByTrackId,
  createSongchord,
  updateSongchord,
  deleteSongchord
} from '../controllers/songchordController';

const router = express.Router();

// GET /api/songchords - получить все связи
router.get('/', getAllSongchords as express.RequestHandler);

// GET /api/songchords/track/:trackId - получить аккорды по ID песни
router.get('/track/:trackId', getChordsByTrackId as express.RequestHandler);

// GET /api/songchords/:id - получить связь по ID
router.get('/:id', getSongchordById as express.RequestHandler);

// POST /api/songchords - создать новую связь
router.post('/', createSongchord as express.RequestHandler);

// PUT /api/songchords/:id - обновить связь
router.put('/:id', updateSongchord as express.RequestHandler);

// DELETE /api/songchords/:id - удалить связь
router.delete('/:id', deleteSongchord as express.RequestHandler);

export default router; 