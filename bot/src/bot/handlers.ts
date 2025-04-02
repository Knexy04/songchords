import TelegramBot, { InputMediaPhoto } from 'node-telegram-bot-api';
import { apiService } from '../services/api';
import { getUserQueryInputTrack, getPaginatedTracks, CHUNK_TO_RENDER_TRACKS } from '../utils/helpers';
import { responsePageSongKeyboard, responseSongKeyboard } from './keyboards';
import { IChord, ITrack } from '../types';
import { parseEnvs } from '../config/env';

const userPagination = new Map<number, ITrack[]>();

function getParamsForSendTrack(track: ITrack): { text: string, options: TelegramBot.SendMessageOptions } {
    return {
        text: `\`\`\`\ Текст песни:\n${track.text}\n\nАвтор: ${track.author.name}\nТрек: ${track.name}\`\`\``,
        options: responseSongKeyboard(track),
    };
}

async function sendSingleTrack(bot: TelegramBot, chatId: number, track: ITrack): Promise<void> {
    const { text, options } = getParamsForSendTrack(track);
    await bot.sendMessage(chatId, text, options);
}

export async function getTracksPage(bot: TelegramBot, chatId: number, page: string = '0'): Promise<void> {
    const tracks = userPagination.get(chatId);
    if (!tracks) {
        return;
    }

    const pageNum = Number(page) || 0;
    const tracksPagesCount = Math.ceil(tracks.length / CHUNK_TO_RENDER_TRACKS);
    const tracksToRender = getPaginatedTracks(tracks, pageNum);

    const textTracksToRender = tracksToRender.map((track, index) => 
        `♬ ${pageNum * CHUNK_TO_RENDER_TRACKS + index + 1}. ${track.author.name} - ${track.name}`
    ).join('\n');

    await bot.sendMessage(
        chatId, 
        `Выберите трек и напишите его номер:\n\n${textTracksToRender}`, 
        responsePageSongKeyboard(pageNum, tracksPagesCount)
    );
}

async function sendTracksResponse(
    bot: TelegramBot, 
    chatId: number, 
    tracks: ITrack[], 
    notFoundMessage: string
): Promise<void> {
    if (tracks.length === 0) {
        await bot.sendMessage(chatId, notFoundMessage);
    } else if (tracks.length === 1) {
        await sendSingleTrack(bot, chatId, tracks[0]);
    } else {
        userPagination.set(chatId, tracks);
        await getTracksPage(bot, chatId);
    }
}

export async function handleGetTrack(bot: TelegramBot, chatId: number, trackNumber: string): Promise<void> {
    const trackIndexNum = Number(trackNumber) - 1;
    const track = userPagination.get(chatId)?.[trackIndexNum];
    
    if (!track) {
        await bot.sendMessage(chatId, 'Трек с таким номером не найден');
        return;
    }
    
    await sendSingleTrack(bot, chatId, track);
}

export async function getChordsForTrack(bot: TelegramBot, chatId: number, trackId: string): Promise<void> {
    const { getChordsByTrackId } = apiService();
    const { API_URL } = parseEnvs();
    const chords = await getChordsByTrackId(trackId);

    if (!chords.length) {
        await bot.sendMessage(chatId, 'Аккорды для этого трека не найдены');
        return;
    }

    let mediaGroup: InputMediaPhoto[] = chords
        .map((chord: IChord) => {
            const photoUrl = chord.idChord.photo;
            
            const fullUrl = photoUrl.startsWith('http') 
                ? photoUrl 
                : API_URL + photoUrl;
                
            return {
                type: 'photo',
                media: fullUrl,
                caption: chord.idChord.name,
            } as InputMediaPhoto;
        })
        .filter(Boolean) as InputMediaPhoto[];

    try {
        if (mediaGroup.length > 0) {
            // Разбиваем на группы по 10 изображений (ограничение Telegram)
            const TELEGRAM_MEDIA_GROUP_LIMIT = 10;
            const mediaGroups: InputMediaPhoto[][] = [];
            
            for (let i = 0; i < mediaGroup.length; i += TELEGRAM_MEDIA_GROUP_LIMIT) {
                mediaGroups.push(mediaGroup.slice(i, i + TELEGRAM_MEDIA_GROUP_LIMIT));
            }

            console.log(mediaGroups);
            
            // Отправляем каждую группу последовательно
            for (const group of mediaGroups) {
                await bot.sendMediaGroup(chatId, group);
            }
        } else {
            await bot.sendMessage(chatId, 'Не удалось загрузить изображения аккордов');
        }
    } catch (error) {
        console.error('Ошибка при отправке аккордов:', error);
        await bot.sendMessage(chatId, 'Произошла ошибка при отправке аккордов');
    }
}

export async function handleGetTracksByAuthor(bot: TelegramBot, chatId: number, authorName: string): Promise<void> {
    const { getAuthorByName, getTracksByAuthor } = apiService();
    const author = await getAuthorByName(authorName);
    
    await sendTracksResponse(
        bot, 
        chatId, 
        author ? await getTracksByAuthor(author._id) : [], 
        'Автор не найден или у него нет треков'
    );
}

export async function handleGetSpecificTrack(bot: TelegramBot, chatId: number, userInput: string): Promise<void> {
    const { getTracksByDto } = apiService();
    const [authorName, songName] = getUserQueryInputTrack(userInput);
    
    await sendTracksResponse(
        bot, 
        chatId, 
        await getTracksByDto(authorName, songName), 
        `По запросу "${userInput}" ничего не найдено`
    );
}

export async function handleGetTracksByName(bot: TelegramBot, chatId: number, trackName: string): Promise<void> {
    const { getTracksByName } = apiService();
    
    await sendTracksResponse(
        bot, 
        chatId, 
        await getTracksByName(trackName), 
        'Треки с таким названием не найдены'
    );
}

export async function handleGetTracksByText(bot: TelegramBot, chatId: number, trackText: string): Promise<void> {
    const { getTracksByText } = apiService();
    
    await sendTracksResponse(
        bot, 
        chatId, 
        await getTracksByText(trackText), 
        'Треки с таким текстом не найдены'
    );
} 