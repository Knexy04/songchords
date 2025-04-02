import TelegramBot from 'node-telegram-bot-api';
import { isSpecificTrackSearch, isNumberInput, getUserQueryInputTrack, getPaginatedTracks, unknownCommandResponse, CHUNK_TO_RENDER_TRACKS } from './helpers';
import { ITrack } from '../types';
import mongoose from 'mongoose';

// Мокаем зависимости
jest.mock('node-telegram-bot-api');

describe('Хелперы', () => {
  describe('isSpecificTrackSearch', () => {
    it('должен вернуть true для текста с дефисом и ненулевыми частями', () => {
      expect(isSpecificTrackSearch('Автор - Песня')).toBe(true);
      expect(isSpecificTrackSearch('Исполнитель-Трек')).toBe(true);
    });

    it('должен вернуть false если одна из частей пустая', () => {
      expect(isSpecificTrackSearch('Автор - ')).toBe(false);
      expect(isSpecificTrackSearch(' - Песня')).toBe(false);
    });

    it('должен вернуть false если нет дефиса', () => {
      expect(isSpecificTrackSearch('Текст без дефиса')).toBe(false);
    });
  });

  describe('isNumberInput', () => {
    it('должен вернуть true для положительных целых чисел', () => {
      expect(isNumberInput('0')).toBe(true);
      expect(isNumberInput('1')).toBe(true);
      expect(isNumberInput('42')).toBe(true);
      expect(isNumberInput(' 10 ')).toBe(true);
    });

    it('должен вернуть false для отрицательных или нецелых чисел', () => {
      expect(isNumberInput('-1')).toBe(false);
      expect(isNumberInput('1.5')).toBe(false);
    });

    it('должен вернуть false для нечисловых входных данных', () => {
      expect(isNumberInput('abc')).toBe(false);
      expect(isNumberInput('1a')).toBe(false);
    });
  });

  describe('getUserQueryInputTrack', () => {
    it('должен корректно разделить строку по дефису и обрезать пробелы', () => {
      expect(getUserQueryInputTrack('Автор - Песня')).toEqual(['Автор', 'Песня']);
      expect(getUserQueryInputTrack('  Исполнитель  -  Трек  ')).toEqual(['Исполнитель', 'Трек']);
    });
  });

  describe('getPaginatedTracks', () => {
    const mockTracks = Array(25).fill(null).map((_, index) => ({
      _id: new mongoose.Types.ObjectId(),
      name: `Трек ${index}`,
      name1: `Track ${index}`,
      author: {
        _id: new mongoose.Types.ObjectId(),
        name: `Автор ${index}`,
        name1: `Author ${index}`
      },
      text: `Текст песни ${index}`
    })) as unknown as ITrack[];

    it('должен возвращать правильно разбитые на страницы треки', () => {
      const firstPage = getPaginatedTracks(mockTracks, 0);
      expect(firstPage.length).toBe(CHUNK_TO_RENDER_TRACKS);
      expect(firstPage[0].name).toBe('Трек 0');

      const secondPage = getPaginatedTracks(mockTracks, 1);
      expect(secondPage.length).toBe(CHUNK_TO_RENDER_TRACKS);
      expect(secondPage[0].name).toBe(`Трек ${CHUNK_TO_RENDER_TRACKS}`);

      const lastPage = getPaginatedTracks(mockTracks, 2);
      expect(lastPage.length).toBe(5); // 25 - (2 * 10) = 5
      expect(lastPage[0].name).toBe(`Трек ${2 * CHUNK_TO_RENDER_TRACKS}`);
    });

    it('должен возвращать пустой массив, если страница вне диапазона', () => {
      expect(getPaginatedTracks(mockTracks, 10).length).toBe(0);
    });
  });

  describe('unknownCommandResponse', () => {
    it('должен отправлять сообщение о неизвестной команде', () => {
      const mockBot = new TelegramBot('token');
      const chatId = 123456;
      
      unknownCommandResponse(mockBot, chatId);
      
      expect(mockBot.sendMessage).toHaveBeenCalledWith(chatId, 'Неизвестная команда');
    });
  });
}); 