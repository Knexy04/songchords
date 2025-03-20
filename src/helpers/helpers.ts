import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import { ITrack } from '../interfaces';

dotenv.config();

const CHUNK_TO_RENDER_TRACKS = 10;

export const parseEnvs = () => {
    const MONGO_URL = process.env.MONGO_URL as string;
    const DB_NAME = process.env.DB_NAME as string;
    const TOKEN = process.env.TOKEN as string;

    if (!MONGO_URL || !DB_NAME || !TOKEN) {
        throw new Error('❌ Не заданы переменные окружения MONGO_URL, DB_NAME или TOKEN');
    }

    return {
        MONGO_URL,
        DB_NAME,
        TOKEN,
    }
};

export const unknownCommandResponse = (bot: TelegramBot, chatId: number) => {
    bot.sendMessage(chatId, 'Неизвестная команда');
};

export const isSpecificTrackSearch = (text: string) => {
    const [userRequestTrackName = null, AuthorName = null] = text.split('-');

    return userRequestTrackName && AuthorName && userRequestTrackName.trim().length > 0 && AuthorName.trim().length > 0;
};

export function isNumberInput(text: string): boolean {
    const num = Number(text.trim());
    return Number.isInteger(num) && num >= 0;
}

export const getUserQueryInputTrack = (text: string) => {
    const [authorName, trackName] = text.split('-');

    return [authorName.trim(), trackName.trim()];
};

export function getPaginatedTracks(tracks: ITrack[], page: number) {
    const start = page * CHUNK_TO_RENDER_TRACKS;
    return tracks.slice(start, start + CHUNK_TO_RENDER_TRACKS);
}