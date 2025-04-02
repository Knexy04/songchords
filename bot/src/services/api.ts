import axios from 'axios';
import { IChord, ITrack } from '../types';
import { ObjectId } from 'mongodb';
import { parseEnvs } from '../config/env';

// Получаем URL API из переменных окружения
const { API_URL } = parseEnvs();

export const apiService = () => {
  const getAuthorByName = async (authorName: string) => {
    try {
      const response = await axios.get(`${API_URL}/authors/name/${authorName}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении автора по имени:', error);
      return null;
    }
  };

  const getTracksByAuthor = async (authorId: ObjectId): Promise<ITrack[]> => {
    try {
      const response = await axios.get(`${API_URL}/songs/author/${authorId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении песен по автору:', error);
      return [];
    }
  };

  const getTracksByText = async (text: string): Promise<ITrack[]> => {
    try {
      const response = await axios.get(`${API_URL}/songs/search/text`, {
        params: { text }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске песен по тексту:', error);
      return [];
    }
  };

  const getTracksByName = async (songName: string): Promise<ITrack[]> => {
    try {
      const response = await axios.get(`${API_URL}/songs/search/name`, {
        params: { name: songName }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске песен по названию:', error);
      return [];
    }
  };

  const getTracksByDto = async (authorName: string, songName: string): Promise<ITrack[]> => {
    try {
      const response = await axios.get(`${API_URL}/songs/search/dto`, {
        params: { authorName, songName }
      });
      return response.data;
    } catch (error) {
      console.error('Ошибка при поиске песен по автору и названию:', error);
      return [];
    }
  };

  const getChordsByTrackId = async (trackId: string) => {

    try {
      const response = await axios.get(`${API_URL}/songchords/track/${trackId}`);
      return response.data;
    } catch (error) {
      console.error('Ошибка при получении аккордов песни:', error);
      return [];
    }
  };

  return { 
    getAuthorByName, 
    getTracksByAuthor, 
    getTracksByText, 
    getTracksByName, 
    getTracksByDto, 
    getChordsByTrackId 
  };
}; 