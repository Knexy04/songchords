import { Request, Response } from 'express';
import { Song, Author } from '../models';
import mongoose from 'mongoose';

// Получить все песни
export const getAllSongs = async (req: Request, res: Response) => {
  try {
    const songs = await Song.find().populate('author');
    res.status(200).json(songs);
  } catch (error) {
    console.error('Ошибка при получении песен:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении песен' });
  }
};

// Получить песню по ID
export const getSongById = async (req: Request, res: Response) => {
  try {
    const song = await Song.findById(req.params.id).populate('author');
    
    if (!song) {
      return res.status(404).json({ message: 'Песня не найдена' });
    }
    
    res.status(200).json(song);
  } catch (error) {
    console.error('Ошибка при получении песни:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении песни' });
  }
};

// Получить песни по ID автора
export const getTracksByAuthor = async (req: Request, res: Response) => {
  try {
    const authorId = req.params.authorId;
    
    if (!mongoose.Types.ObjectId.isValid(authorId)) {
      return res.status(400).json({ message: 'Некорректный ID автора' });
    }

    const songs = await Song.find({ author: authorId }).populate('author').lean();
    
    res.status(200).json(songs);
  } catch (error) {
    console.error('Ошибка при получении песен по автору:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении песен по автору' });
  }
};

// Получить песни по тексту
export const getTracksByText = async (req: Request, res: Response) => {
  try {
    const { text } = req.query;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ message: 'Необходимо указать текст для поиска' });
    }

    // Убедимся, что индексы созданы
    await Song.createIndexes();
    
    const songs = await Song.find({ 
      text: { $regex: text, $options: 'i' } 
    }).populate('author').lean();
    
    res.status(200).json(songs);
  } catch (error) {
    console.error('Ошибка при поиске песен по тексту:', error);
    res.status(500).json({ message: 'Ошибка сервера при поиске песен по тексту' });
  }
};

// Получить песни по названию
export const getTracksByName = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'Необходимо указать название песни' });
    }
    
    const songs = await Song.find({ 
      $or: [
        { name: name }, 
        { name1: name }
      ] 
    }).populate('author').lean();
    
    res.status(200).json(songs);
  } catch (error) {
    console.error('Ошибка при поиске песен по названию:', error);
    res.status(500).json({ message: 'Ошибка сервера при поиске песен по названию' });
  }
};

// Получить песни по имени автора и названию песни
export const getTracksByDto = async (req: Request, res: Response) => {
  try {
    const { authorName, songName } = req.query;
    
    if (!authorName || !songName || typeof authorName !== 'string' || typeof songName !== 'string') {
      return res.status(400).json({ 
        message: 'Необходимо указать имя автора и название песни' 
      });
    }
    
    const author = await Author.findOne({ name: authorName }).lean();
    
    if (!author) {
      return res.status(404).json({ message: 'Автор не найден' });
    }
    
    const songs = await Song.find({ 
      $and: [
        { $or: [{ name: songName }, { name1: songName }] }, 
        { author: author._id }
      ] 
    }).populate('author').lean();
    
    res.status(200).json(songs);
  } catch (error) {
    console.error('Ошибка при поиске песен по автору и названию:', error);
    res.status(500).json({ message: 'Ошибка сервера при поиске песен по автору и названию' });
  }
};

// Создать новую песню
export const createSong = async (req: Request, res: Response) => {
  try {
    const { name, name1, author, text } = req.body;
    
    if (!name || !author) {
      return res.status(400).json({ 
        message: 'Необходимо указать название песни и ID автора' 
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(author)) {
      return res.status(400).json({ message: 'Некорректный ID автора' });
    }
    
    // Проверяем существование автора
    const existingAuthor = await Author.findById(author);
    if (!existingAuthor) {
      return res.status(404).json({ message: 'Указанный автор не существует' });
    }
    
    const newSong = new Song({ name, name1, author, text });
    const savedSong = await newSong.save();
    
    const populatedSong = await Song.findById(savedSong._id).populate('author');
    
    res.status(201).json(populatedSong);
  } catch (error) {
    console.error('Ошибка при создании песни:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании песни' });
  }
};

// Обновить песню
export const updateSong = async (req: Request, res: Response) => {
  try {
    const { name, name1, author, text } = req.body;
    
    if (author && !mongoose.Types.ObjectId.isValid(author)) {
      return res.status(400).json({ message: 'Некорректный ID автора' });
    }
    
    // Если указан автор, проверяем его существование
    if (author) {
      const existingAuthor = await Author.findById(author);
      if (!existingAuthor) {
        return res.status(404).json({ message: 'Указанный автор не существует' });
      }
    }
    
    const updatedSong = await Song.findByIdAndUpdate(
      req.params.id,
      { name, name1, author, text },
      { new: true }
    ).populate('author');
    
    if (!updatedSong) {
      return res.status(404).json({ message: 'Песня не найдена' });
    }
    
    res.status(200).json(updatedSong);
  } catch (error) {
    console.error('Ошибка при обновлении песни:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении песни' });
  }
};

// Удалить песню
export const deleteSong = async (req: Request, res: Response) => {
  try {
    const deletedSong = await Song.findByIdAndDelete(req.params.id);
    
    if (!deletedSong) {
      return res.status(404).json({ message: 'Песня не найдена' });
    }
    
    res.status(200).json({ message: 'Песня успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении песни:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении песни' });
  }
}; 