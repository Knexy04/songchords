import { Request, Response } from 'express';
import { Songchord, Chord } from '../models';
import { IChord } from '../models/Chord';
import mongoose from 'mongoose';

// Получить все связи аккордов с песнями
export const getAllSongchords = async (req: Request, res: Response) => {
  try {
    const songchords = await Songchord.find().populate('idChord');
    res.status(200).json(songchords);
  } catch (error) {
    console.error('Ошибка при получении связей песен с аккордами:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении связей песен с аккордами' });
  }
};

// Получить связь аккорда с песней по ID
export const getSongchordById = async (req: Request, res: Response) => {
  try {
    const songchord = await Songchord.findById(req.params.id).populate('idChord');

    if (!songchord) {
      return res.status(404).json({ message: 'Связь песни с аккордом не найдена' });
    }

    res.status(200).json(songchord);
  } catch (error) {
    console.error('Ошибка при получении связи песни с аккордом:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении связи песни с аккордом' });
  }
};

// Получить аккорды по ID песни
export const getChordsByTrackId = async (req: Request, res: Response) => {
  try {
    const trackId = req.params.trackId;

    if (!trackId) {
      return res.status(400).json({ message: 'Необходимо указать ID песни' });
    }

    // Убедимся, что индексы созданы
    await Chord.createIndexes();

    const songchords = await Songchord.find({ idSong: mongoose.Types.ObjectId.createFromHexString(trackId) }).populate<{ idChord: IChord }>('idChord').lean();

    // Добавляем полные URL-адреса к фотографиям аккордов
    const songsWithPhotoUrls = songchords.map(songchord => {
      if (songchord.idChord && songchord.idChord.photo) {
        songchord.idChord.photo = `/static/assets/chords/${songchord.idChord.photo}`.split('\\').join('/');
      }
      return songchord;
    });

    res.status(200).json(songsWithPhotoUrls);
  } catch (error) {
    console.error('Ошибка при получении аккордов песни:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении аккордов песни' });
  }
};

// Создать новую связь аккорда с песней
export const createSongchord = async (req: Request, res: Response) => {
  try {
    const { idSong, idChord } = req.body;

    if (!idSong || !idChord) {
      return res.status(400).json({
        message: 'Необходимо указать ID песни и ID аккорда'
      });
    }

    // Проверяем существование аккорда
    const existingChord = await Chord.findById(idChord);
    if (!existingChord) {
      return res.status(404).json({ message: 'Указанный аккорд не существует' });
    }

    const newSongchord = new Songchord({ idSong, idChord });
    const savedSongchord = await newSongchord.save();

    const populatedSongchord = await Songchord.findById(savedSongchord._id).populate('idChord');

    res.status(201).json(populatedSongchord);
  } catch (error) {
    console.error('Ошибка при создании связи песни с аккордом:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании связи песни с аккордом' });
  }
};

// Обновить связь аккорда с песней
export const updateSongchord = async (req: Request, res: Response) => {
  try {
    const { idSong, idChord } = req.body;

    // Если указан аккорд, проверяем его существование
    if (idChord) {
      const existingChord = await Chord.findById(idChord);
      if (!existingChord) {
        return res.status(404).json({ message: 'Указанный аккорд не существует' });
      }
    }

    const updatedSongchord = await Songchord.findByIdAndUpdate(
      req.params.id,
      { idSong, idChord },
      { new: true }
    ).populate('idChord');

    if (!updatedSongchord) {
      return res.status(404).json({ message: 'Связь песни с аккордом не найдена' });
    }

    res.status(200).json(updatedSongchord);
  } catch (error) {
    console.error('Ошибка при обновлении связи песни с аккордом:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении связи песни с аккордом' });
  }
};

// Удалить связь аккорда с песней
export const deleteSongchord = async (req: Request, res: Response) => {
  try {
    const deletedSongchord = await Songchord.findByIdAndDelete(req.params.id);

    if (!deletedSongchord) {
      return res.status(404).json({ message: 'Связь песни с аккордом не найдена' });
    }

    res.status(200).json({ message: 'Связь песни с аккордом успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении связи песни с аккордом:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении связи песни с аккордом' });
  }
}; 