import express from 'express';
import {
  getAllAuthors,
  getAuthorById,
  getAuthorByName,
  createAuthor,
  updateAuthor,
  deleteAuthor
} from '../controllers/authorController';

const router = express.Router();

// GET /api/authors - получить всех авторов
router.get('/', getAllAuthors);

// GET /api/authors/name/:name - получить автора по имени
router.get('/name/:name', getAuthorByName as express.RequestHandler);

// GET /api/authors/:id - получить автора по ID
router.get('/:id', getAuthorById as express.RequestHandler);

// POST /api/authors - создать нового автора
router.post('/', createAuthor as express.RequestHandler);

// PUT /api/authors/:id - обновить автора
router.put('/:id', updateAuthor as express.RequestHandler);

// DELETE /api/authors/:id - удалить автора
router.delete('/:id', deleteAuthor as express.RequestHandler);

export default router; 