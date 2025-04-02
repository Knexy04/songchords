import express from 'express';
import {
  getAllChords,
  getChordById,
  createChord,
  updateChord,
  deleteChord
} from '../controllers/chordController';

const router = express.Router();

// GET /api/chords - получить все аккорды
router.get('/', getAllChords);

// GET /api/chords/:id - получить аккорд по ID
router.get('/:id', getChordById as express.RequestHandler);

// POST /api/chords - создать новый аккорд
router.post('/', createChord as express.RequestHandler);

// PUT /api/chords/:id - обновить аккорд
router.put('/:id', updateChord as express.RequestHandler);

// DELETE /api/chords/:id - удалить аккорд
router.delete('/:id', deleteChord as express.RequestHandler);

export default router; 