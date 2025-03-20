import TelegramBot, { InputMediaPhoto, SendMessageOptions } from 'node-telegram-bot-api';
import { queries } from '../queries';
import { getUserQueryInputTrack } from '../helpers';
import { responsePageSongKeyboard, responseSongKeyboard } from '../keyboards';
import { IChord, ITrack } from '../interfaces';
import path from 'path';
import fs from 'fs';

const userPagination = new Map<number, ITrack[]>();

const CHUNK_TO_RENDER_TRACKS = 10;

function getParamsForSendTrack(track: ITrack) {
    return {
        text: `\`\`\`\ Текст песни:\n${track.text}\n\nАвтор: ${track.author.name}\nТрек: ${track.name}\`\`\``,
        options: responseSongKeyboard(track),
    };
}

async function sendSingleTrack(bot: TelegramBot, chatId: number, track: ITrack) {
    const { text, options } = getParamsForSendTrack(track);
    await bot.sendMessage(chatId, text, options);
}

export async function getTracksPage(bot: TelegramBot, chatId: number, page: string = '0') {
    const tracks = userPagination.get(chatId);
    if (!tracks) {
        return;
    };

    const tracksPagesCount = Math.ceil(tracks.length / CHUNK_TO_RENDER_TRACKS);
    const pageNum = Number(page) || 0;
    const tracksToRender = tracks.slice(pageNum * CHUNK_TO_RENDER_TRACKS, pageNum * CHUNK_TO_RENDER_TRACKS + CHUNK_TO_RENDER_TRACKS);

    const textTracksToRender = tracksToRender.map((track, index) => `♬ ${pageNum * CHUNK_TO_RENDER_TRACKS + index + 1}. ${track.author.name} - ${track.name}`).join('\n');

    bot.sendMessage(chatId, `Выберите трек и напишите его номер:\n\n${textTracksToRender}`, responsePageSongKeyboard(pageNum, tracksPagesCount));
}

async function sendTracksResponse(bot: TelegramBot, chatId: number, tracks: ITrack[], notFoundMessage: string) {
    if (tracks.length === 0) {
        await bot.sendMessage(chatId, notFoundMessage);
    } else if (tracks.length === 1) {
        await sendSingleTrack(bot, chatId, tracks[0]);
    } else {
        userPagination.set(chatId, tracks);
        await getTracksPage(bot, chatId);
    }
}

export async function handleGetTrack(bot: TelegramBot, chatId: number, trackNumber: string) {
    const trackIndexNum = Number(trackNumber) - 1;
    const track = userPagination.get(chatId)?.[trackIndexNum];
    if (!track) {
        await bot.sendMessage(chatId, 'Трек с таким номером не найден');
        return;
    };
    await sendSingleTrack(bot, chatId, track)
}

export async function getChordsForTrack(bot: TelegramBot, chatId: number, trackId: string) {
    const { getChordsByTrackId } = queries();
    const chords: IChord[] = await getChordsByTrackId(trackId);

    const mediaGroup: InputMediaPhoto[] = chords.map(accord => {
        const filePath = path.join(__dirname, '../../', 'public', accord.idChord.photo);
        return {
            type: 'photo',
            media: fs.createReadStream(filePath),
            caption: accord.idChord.name,
        } as unknown as InputMediaPhoto;
    });

    await bot.sendMediaGroup(chatId, mediaGroup);
}

export async function handleGetTracksByAuthor(bot: TelegramBot, chatId: number, authorName: string) {
    const { getAuthorByName, getTracksByAuthor } = queries();
    const author = await getAuthorByName(authorName);
    await sendTracksResponse(bot, chatId, author ? await getTracksByAuthor(author._id) : [], 'Автор не найден или у него нет треков');
}

export async function handleGetSpecificTrack(bot: TelegramBot, chatId: number, userInput: string) {
    const { getTracksByDto } = queries();
    const [authorName, songName] = getUserQueryInputTrack(userInput);
    await sendTracksResponse(bot, chatId, await getTracksByDto(authorName, songName), `По запросу "${userInput}" ничего не найдено`);
}

export async function handleGetTracksByName(bot: TelegramBot, chatId: number, trackName: string) {
    const { getTracksByName } = queries();
    await sendTracksResponse(bot, chatId, await getTracksByName(trackName), 'Треки с таким названием не найдены');
}

export async function handleGetTracksByText(bot: TelegramBot, chatId: number, trackText: string) {
    const { getTracksByText } = queries();
    await sendTracksResponse(bot, chatId, await getTracksByText(trackText), 'Треки с таким текстом не найдены');
}