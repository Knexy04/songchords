import { Request, Response, NextFunction } from 'express';

// Обработчик невалидных маршрутов
export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Не найдено - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Обработчик ошибок
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '📚' : err.stack,
  });
}; 