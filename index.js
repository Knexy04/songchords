const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const {https} = require("https");

const TOKEN = '6123443092:AAFOcCqr-Ekd4YtJ-EnqRNtYy19Xaw0Xh90';
const MONGO_URL = 'mongodb+srv://admin_1:lhEaP3YV47OK4f3O@songchord.tip91go.mongodb.net/?retryWrites=true&w=majority';
const DB_NAME = 'songs';

const bot = new TelegramBot(TOKEN, { polling: true });

let all_tracks_author=[]

let mongo_db;
let mongo_author_collection;
let mongo_song_collection;
let mongo_accord_collection;
let mongo_song_accord_collection;

const wakeServer = () => {

    function sendRequestToServer() {
        // Здесь вы можете настроить опции запроса (например, URL, метод и др.)
        const options = {
            hostname: 'https://song-accord-bot.onrender.com',
            port: 443,
            path: '/',
            method: 'GET',
        };

        // Создаем HTTP запрос
        const req = https.request(options, (res) => {
            console.log(`Status code: ${res.statusCode}`);
            console.log(req)
        });

        // Обрабатываем ошибки запроса
        req.on('error', (error) => {
            console.error(`Error sending request: ${error}`);
        });

        // Завершаем запрос
        req.end();
    }


// Отправляем запрос каждые 5 минут (300 000 миллисекунд)
    setInterval(sendRequestToServer, 300000);

}

wakeServer()

async function connectToMongo() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    console.log('Connected to MongoDB');
    mongo_db = client.db(DB_NAME);
    mongo_author_collection = mongo_db.collection('author');
    mongo_song_collection = mongo_db.collection('song');
    mongo_accord_collection = mongo_db.collection('accord');
    mongo_song_accord_collection = mongo_db.collection('songaccord');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

// Вызываем функцию для подключения к MongoDB
connectToMongo();


bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  const messageText = msg.text.trim();
  if (messageText.match(/^\d+$/)) {
    // Handle numeric input (assuming it's a track number)
    await handleNumericInput(chatId, messageText);
  } else {
    // Handle text input
    await handleTextInput(chatId, messageText);
  }
});

async function handleNumericInput(chatId, trackNumber) {
  try {
    if (!lenArray(trackNumber)) {
      bot.sendMessage(chatId, `Извините, трека под номером ${trackNumber} нет.`);
      return;
    }

    const [soundTrack, author] = await returnSoundTrack(trackNumber, chatId);
    const song = await mongo_song_collection.findOne({ _id: soundTrack });
    const infoAuthor = await mongo_author_collection.findOne({ _id: author });

    const text = `\`\`\`\nТекст песни:\n${song.text}\n\nАвтор: ${infoAuthor.name}\nТрек: ${song.name}\`\`\``;

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Посмотреть аккорды', callback_data: `chords_${soundTrack}` }],
          [{ text: 'Посмотреть все треки автора', callback_data: `allTracks_${author}` }],
        ],
      },
      parse_mode: 'Markdown',
    };

    bot.sendMessage(chatId, text, inlineKeyboard);
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
  }
}

async function handleTextInput(chatId, userInput) {
  try {
    // Check if the input is the /start command
    if (userInput.trim() === '/start') {
      // Handle /start command separately
      bot.sendMessage(chatId, 'Привет! Введите название автора и/или название трека через "-" (Автор-Трек), только имя автора или только название трека');
      return;
    }
    const input_data = userInput.split('-').map((item) => item.trim());
    let [author, track] = [input_data[0], input_data[1]];

    if (!track) {
      track = author;
    }
    const author_query = {
      $or: [
        { name: { $regex: new RegExp(author, 'i') } },
        { name1: { $regex: new RegExp(author, 'i') } },
      ],
    };

    const track_query = {
      $or: [
        { name: { $regex: new RegExp(track, 'i') } },
        { name1: { $regex: new RegExp(track, 'i') } },
      ],
    };

    const author_matches = await mongo_author_collection.find(author_query).toArray();
    const track_matches = await mongo_song_collection.find(track_query).toArray();

    if (track_matches.length > 0 && author_matches.length > 0) {
      const result_array = [];
      for (const item1 of track_matches) {
        if (item1.author.toString() == author_matches[0]._id.toString() ){
            result_array.push({
                idAuthor: author_matches[0]._id ,
                idSong: item1._id,
                name: item1.name,
                text: item1.text,
                author_name: author_matches[0].name,
              });
            break
        }
    }

      const song = result_array[0];
      const text = `\`\`\`\nТекст песни:\n${song.text}\n\nАвтор: ${song.author_name}\nТрек: ${song.name}\`\`\``;

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Посмотреть аккорды', callback_data: `chords_${song.idSong}` }],
            [{ text: 'Посмотреть все треки автора', callback_data: `allTracks_${song.idAuthor}` }],
          ],
        },
        parse_mode: 'Markdown',
      };

      bot.sendMessage(chatId, text, inlineKeyboard);
    } else if (track_matches.length > 0) {
      await sendTracks(chatId, track_matches, false);
    } else if (author_matches.length > 0) {
      await sendTracks(chatId, author_matches, true);
    } else {
      bot.sendMessage(chatId, 'Извините, ничего не найдено. Пожалуйста, попробуйте еще раз.');
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
  }
}

async function sendTracks(chatId, allTracks, byAuthor) {
  try {
    if (byAuthor) {
      const id_author = allTracks[0]._id;
      await showAllTracksByAuthor(chatId, id_author);
    } else {
      const track = allTracks[0].author;
      const author = await mongo_author_collection.findOne({ _id: track });

      const text = `\`\`\`\nТекст песни:\n${allTracks[0].text}\n\nАвтор: ${author.name}\nТрек: ${allTracks[0].name}\`\`\``;

      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Посмотреть аккорды', callback_data: `chords_${allTracks[0]._id}` }],
            [{ text: 'Посмотреть все треки автора', callback_data: `allTracks_${author._id}` }],
          ],
        },
        parse_mode: 'Markdown',
      };

      bot.sendMessage(chatId, text, inlineKeyboard);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
  }
}

function lenArray(message) {
  for (const tracks of all_tracks_author) {
    if (Number(message) > tracks[0].length) {
      return false;
    } else {
      return true;
    }
  }
  return false;
}

async function returnSoundTrack(message, chat_id) {
  for (const tracks of all_tracks_author) {
    if (parseInt(tracks[1]) == chat_id) {
      return [tracks[0][Number(message) - 1]._id, tracks[0][Number(message) - 1].author];
    }
  }
}

async function tracksinArray(array, chatId) {
  let count = 0;
  for (let i = 0; i < all_tracks_author.length; i++) {
    if (all_tracks_author[i][1] === chatId) {
      all_tracks_author[i][0] = array;
      count++;
      break;
    }
  }
  if (count === 0) {
    all_tracks_author.push([array, chatId]);
  }
}

async function showAllTracksByAuthor(chatId, authorId, page = 1, tracksPerPage = 15, messageId = null) {
  try {
    const idAuthor = new ObjectId(authorId)
    const author = await mongo_author_collection.findOne({ _id: idAuthor });
    const allTracks = await mongo_song_collection.find({ author: idAuthor }).toArray();

    await tracksinArray(allTracks, chatId);

    if (!allTracks.length) {
      bot.sendMessage(chatId, 'У автора нет треков.');
      return;
    }

    const startIndex = (page - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const currentTracks = allTracks.slice(startIndex, endIndex);

    if (!currentTracks.length) {
      bot.sendMessage(chatId, 'Достигнут конец списка.');
      return;
    }

    let trackMessage = '';
    for (let i = startIndex; i < currentTracks.length + startIndex; i++) {
      trackMessage += `${i + 1}. ${author.name} - ${currentTracks[i - startIndex].name}\n`;
    }

    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [],
      },
    };

    if (startIndex > 0) {
      inlineKeyboard.reply_markup.inline_keyboard.push([{ text: 'Назад', callback_data: `prev_${idAuthor}_${page}` }]);
    }

    if (endIndex < allTracks.length) {
      inlineKeyboard.reply_markup.inline_keyboard.push([{ text: 'Далее', callback_data: `next_${idAuthor}_${page}` }]);
    }
    if (messageId) {
        await bot.editMessageText(trackMessage,{
            chat_id: chatId, 
            message_id: messageId,
            parse_mode: 'Markdown',
            ...inlineKeyboard 
        });
    } else {
      await bot.sendMessage(chatId, trackMessage, inlineKeyboard);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
  }
}

bot.on('callback_query', async (call) => {
  try {
    const callbackDataParts = call.data.split('_');

    if (call.data.startsWith('chords_')) {
      const trackId = callbackDataParts[1];
      await showChordsWithPhotos(call.message.chat.id, trackId);
      } else if (call.data.startsWith('allTracks_')) {
        const authorId = callbackDataParts[1];
        await showAllTracksByAuthor(call.message.chat.id, authorId);
      } else if (call.data.startsWith('next_') || call.data.startsWith('prev_')) {
        const authorId = callbackDataParts[1];
        const idAuthor = new ObjectId(authorId)
        const page = parseInt(callbackDataParts[2]);
  
        if (call.data.startsWith('next_')) {
          await showAllTracksByAuthor(call.message.chat.id, idAuthor, page + 1, 15, call.message.message_id);
        } else if (call.data.startsWith('prev_')) {
          await showAllTracksByAuthor(call.message.chat.id, idAuthor, Math.max(1, page - 1), 15, call.message.message_id);
        }
      }
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
    }
  });
  
  async function showChordsWithPhotos(chatId, trackId) {
    try {
        const idTrack = new ObjectId(trackId)
        const allAccords = await mongo_song_accord_collection.aggregate([
          {
              $match: { idSong: idTrack }
          },
          {
              $lookup: {
                  from: "accord",
                  localField: "idAccord",
                  foreignField: "_id",
                  as: "accordData"
              }
          },
          {
              $unwind: "$accordData"
          },
          {
              $project: {
                  _id: 0,
                  name: "$accordData.name",
                  media: "$accordData.photo",
              }
          }
      ]).toArray();

      if (allAccords.length === 0) {
          // Handle case when there are no chords to send
          await bot.sendMessage(chatId, 'No chords to send.');
          return;
      }

      const mediaGroup = allAccords.map(accord => {
        let link = accord.media;
        // Проверяем, что длина строки достаточна, чтобы изменить 8-й символ
        if (link.length >= 8) {
            // Заменяем 8-й символ на "/"
            link = link.substring(0, 7) + '/' + link.substring(8);
        }
        console.log(link)
        const mediaLink = `https://song-accord-bot.onrender.com/${link}`;
        
        return {
            type: 'photo',
            media: mediaLink,
        };
    });
      await bot.sendMediaGroup(chatId, mediaGroup);
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
    }
  }
  
  
  if (require.main === module) {
    process.on('SIGINT', async () => {
      if (mongo_db) {
        await mongo_db.close();
        console.log('Disconnected from MongoDB');
      }
      process.exit();
    });
  }