import TelegramBot from "node-telegram-bot-api";
import { ITrack } from "../types";

export const searchUserInputKeyboard = (text: string): TelegramBot.SendMessageOptions => {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Поиск трека', callback_data: `trackSearch_${text}` }],
                [{ text: 'Поиск автора', callback_data: `authorSearch_${text}` }],
                [{ text: 'Поиск песни по тексту', callback_data: `textSearch_${text}` }],
            ],
        },
        parse_mode: 'Markdown',
    }
};

export const responseSongKeyboard = (song: ITrack): TelegramBot.SendMessageOptions => {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Посмотреть гитарные аккорды', callback_data: `getTrackChords_${song._id}` }],
                [{ text: 'Посмотреть все треки автора', callback_data: `getAllTracksAuthors_${song.author.name}` }],
            ],
        },
        parse_mode: 'Markdown',
    };
};

export const responsePageSongKeyboard = (page: number, tracksPagesCount: number): TelegramBot.SendMessageOptions => {
    return {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Назад', callback_data: `prevTracksPage_${Math.max(page-1, 0)}` }],
                [{ text: 'Далее', callback_data: `nextTracksPage_${Math.min(page+1, tracksPagesCount)}` }],
            ],
        },
    };
}; 