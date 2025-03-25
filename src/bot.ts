import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api';
import { parseEnvs, unknownCommandResponse, isSpecificTrackSearch, isNumberInput } from './helpers';
import { searchUserInputKeyboard } from './keyboards';
import { CommandsSearchUserCallback } from './interfaces';
import { getChordsForTrack, getTracksPage, handleGetSpecificTrack, handleGetTrack, handleGetTracksByAuthor, handleGetTracksByName, handleGetTracksByText } from './handlers';
import { connectMongo, disconnectMongo } from '../database';

const { TOKEN } = parseEnvs();
const bot = new TelegramBot(TOKEN, { polling: true });

connectMongo();

bot.on('message', async (msg: Message) => {
  if (!msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (text === '/start') {
    bot.sendMessage(chatId, 'Привет! Введите "Автор - Название", только имя автора или только название трека');
    return;
  }

  if (isNumberInput(text)) {
    await handleGetTrack(bot, chatId, text);
  } else if (isSpecificTrackSearch(text)) {
    await handleGetSpecificTrack(bot, chatId, text);
  } else {
    bot.sendMessage(chatId, 'Что вы ищите? Ответьте нажатием на кнопку ниже:', searchUserInputKeyboard(text));
  }
});

bot.on('callback_query', async (call: CallbackQuery) => {
  if (!call.data || !call.message) return;

  const [callbackKey, queryParam] = call.data.split('_');
  const chatId = call.message.chat.id;

  const handlers: Record<string, (bot: TelegramBot, chatId: number, param: string) => Promise<void>> = {
    [CommandsSearchUserCallback.AuthorSearch]: handleGetTracksByAuthor,
    [CommandsSearchUserCallback.TrackSearch]: handleGetTracksByName,
    [CommandsSearchUserCallback.TextSearch]: handleGetTracksByText,
    [CommandsSearchUserCallback.NextTracksPage]: getTracksPage,
    [CommandsSearchUserCallback.PrevTracksPage]: getTracksPage,
    [CommandsSearchUserCallback.GetAllTracksAutors]: handleGetTracksByAuthor,
    [CommandsSearchUserCallback.GetTrackChords]: getChordsForTrack,
  };

  await (handlers[callbackKey] || unknownCommandResponse)(bot, chatId, queryParam);
});

process.on('SIGINT', async () => {
  console.log('🛑 Остановка бота...');
  await disconnectMongo();
  console.log('✅ MongoDB отключен');
  console.log('✅ Бот остановлен');
  process.exit();
});