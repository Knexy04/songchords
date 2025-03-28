import TelegramBot from 'node-telegram-bot-api';
import { ITrack } from '../types';

export const CHUNK_TO_RENDER_TRACKS = 10;

export const unknownCommandResponse = (bot: TelegramBot, chatId: number): void => {
    bot.sendMessage(chatId, 'Неизвестная команда');
};

export const isSpecificTrackSearch = (text: string): boolean => {
    const parts = text.split('-');
    if (parts.length !== 2) return false;
    
    const [authorPart, trackPart] = parts;
    return Boolean(authorPart?.trim() && trackPart?.trim());
};

export function isNumberInput(text: string): boolean {
    const num = Number(text.trim());
    return Number.isInteger(num) && num >= 0;
}

export const getUserQueryInputTrack = (text: string): [string, string] => {
    const [authorName, trackName] = text.split('-');
    return [authorName.trim(), trackName.trim()];
};

export function getPaginatedTracks(tracks: ITrack[], page: number): ITrack[] {
    const start = page * CHUNK_TO_RENDER_TRACKS;
    return tracks.slice(start, start + CHUNK_TO_RENDER_TRACKS);
} 