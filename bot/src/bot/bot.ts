import TelegramBot, { Message, CallbackQuery } from 'node-telegram-bot-api';
import { parseEnvs } from '../config/env';
import { isSpecificTrackSearch, isNumberInput, unknownCommandResponse } from '../utils/helpers';
import { searchUserInputKeyboard } from './keyboards';
import { CommandsSearchUserCallback } from '../types';
import { 
  getChordsForTrack, 
  getTracksPage, 
  handleGetSpecificTrack,
  handleGetTrack,
  handleGetTracksByAuthor,
  handleGetTracksByName,
  handleGetTracksByText
} from './handlers';

const { TOKEN } = parseEnvs();

const callbackHandlers: Record<string, (bot: TelegramBot, chatId: number, param: string) => Promise<void>> = {
  [CommandsSearchUserCallback.AuthorSearch]: handleGetTracksByAuthor,
  [CommandsSearchUserCallback.TrackSearch]: handleGetTracksByName,
  [CommandsSearchUserCallback.TextSearch]: handleGetTracksByText,
  [CommandsSearchUserCallback.NextTracksPage]: getTracksPage,
  [CommandsSearchUserCallback.PrevTracksPage]: getTracksPage,
  [CommandsSearchUserCallback.GetAllTracksAuthors]: handleGetTracksByAuthor,
  [CommandsSearchUserCallback.GetTrackChords]: getChordsForTrack,
};

export const initBot = (): TelegramBot => {
  const bot = new TelegramBot(TOKEN, { polling: true });

  setupMessageHandlers(bot);
  setupCallbackHandlers(bot);
  setupShutdownHandlers();

  return bot;
};

function setupMessageHandlers(bot: TelegramBot): void {
  bot.on('message', async (msg: Message) => {
    if (!msg.text) return;

    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (text === '/start') {
      bot.sendMessage(chatId, 'Привет! Введите "Автор - Название", только имя автора или только название трека!');
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
}

function setupCallbackHandlers(bot: TelegramBot): void {
  bot.on('callback_query', async (call: CallbackQuery) => {
    if (!call.data || !call.message) return;

    const [callbackKey, queryParam] = call.data.split('_');
    const chatId = call.message.chat.id;

    const handler = callbackHandlers[callbackKey] || unknownCommandResponse;
    await handler(bot, chatId, queryParam);
  });
}

function setupShutdownHandlers(): void {
  process.on('SIGINT', async () => {
    console.log('🛑 Остановка бота...');
    console.log('✅ Бот остановлен');
    process.exit();
  });
} 