const TelegramBot = require('node-telegram-bot-api');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const natural = require('natural');
const phonetic = natural.Metaphone;
const path = require('path'); // Для работы с путями файлов
const fs = require('fs'); // Для работы с файловой системой

const TOKEN = '6837927414:AAHoMdXkpLbSR8gmetTvWjI8-hgSSw3YwEc';
const MONGO_URL = 'mongodb+srv://knexy:vvevIsAvTh2B3Jt4@wtf.90qwju6.mongodb.net/';
const DB_NAME = 'songs';

const bot = new TelegramBot(TOKEN, { polling: true });

let all_tracks_author=[]

let all_authors = []

let all_tracks = []

let flag = []

let all_text = []

let mongo_db;
let mongo_author_collection;
let mongo_song_collection;
let mongo_song_accord_collection;

async function connectToMongo() {
  try {
    const client = await MongoClient.connect(MONGO_URL);
    console.log('Connected to MongoDB');
    mongo_db = client.db(DB_NAME);
    mongo_author_collection = mongo_db.collection('autor');
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

async function returnFlag(chatId){
  for (const fl of flag){
    if (fl[1] == chatId){
      return fl[0]
    }
  }
}

async function handleNumericInput(chatId, trackNumber) {
  const TimeMessageId = (await bot.sendMessage(chatId, "Подождите, выполняю поиск...")).message_id;
  try {
      const f = await returnFlag(chatId)
    if( f == 0){
      if (!lenArray(trackNumber) && text==null) {
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
      bot.deleteMessage(chatId, TimeMessageId)
      bot.sendMessage(chatId, text, inlineKeyboard);
    }
    else if(f == 1){
        if (!lenArray_tracks(trackNumber)) {
          bot.sendMessage(chatId, `Извините, трека под номером ${trackNumber} нет.`);
          return;
        }
    
        const [soundTrack, author] = await returnTrackNumber(trackNumber, chatId);
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
        bot.deleteMessage(chatId, TimeMessageId)
        bot.sendMessage(chatId, text, inlineKeyboard);
    }
    else{
      bot.deleteMessage(chatId, TimeMessageId)
      await handleTextInput(chatId, trackNumber.toString());
    }
  } catch (error) {
    console.error(error);
    bot.deleteMessage(chatId, TimeMessageId)
    bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
  }
}

const jaccardSimilarity = (str1, str2) => {
  const set1 = new Set(str1);
  const set2 = new Set(str2);

  const intersectionSize = new Set([...set1].filter(element => set2.has(element))).size;
  const unionSize = set1.size + set2.size - intersectionSize;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

const calculateAndSort = async (query, matches) => {
  const result = await Promise.all(matches.map(async match => {
    const similarity = jaccardSimilarity(query.toLowerCase(), match.name.toLowerCase());
    return { ...match, similarity };
  }));

  return result.sort((a, b) => b.similarity - a.similarity);
};

async function handleTextInput(chatId, userInput) {
  try {
    if (userInput.trim() === '/start') {
      bot.sendMessage(chatId, 'Привет! Введите название автора и/или название трека через "-" (Автор-Трек), только имя автора или только название трека');
      return;
    }
    const TimeMessageId = (await bot.sendMessage(chatId, "Подождите, выполняю поиск...")).message_id;
    const input_data = userInput.split('-').map((item) => item.trim());
    let [author, track] = [input_data[0], input_data[1]];

    if (!track) {
      track = author;
    }
    const author_query = {
  $or: [
    { name: { $regex: new RegExp(author, 'i') } },
    { name1: { $regex: new RegExp(author, 'i') } },
    { phonetic: phonetic.process(author) },  // Use phonetic.process instead of soundex
  ],
};

const track_query = {
  $or: [
    { name: { $regex: new RegExp(track, 'i') } },
    { name1: { $regex: new RegExp(track, 'i') } },
    { phonetic: phonetic.process(track) },  // Use phonetic.process instead of soundex
  ],
};
    
    const authormatches = await mongo_author_collection.find(author_query).toArray();
    const trackmatches = await mongo_song_collection.find(track_query).toArray();

    
    const author_matches = await calculateAndSort(author.toLowerCase(), authormatches);
    
    const track_matches = await calculateAndSort(track.toLowerCase(), trackmatches);

    
    if (track_matches.length > 0 && author_matches.length > 0 && author!=track) {
      const result_array = [];
      for (const item1 of track_matches) {
        if (item1.autor.toString() == author_matches[0]._id.toString() ){
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
        let song
        let text = ''
          if (result_array.length>0){
            song = result_array[0];
            text = `\`\`\`\nТекст песни:\n${song.text}\n\nАвтор: ${song.author_name}\nТрек: ${song.name}\`\`\``;
          }
      const inlineKeyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Посмотреть аккорды', callback_data: `chords_${song.idSong}` }],
            [{ text: 'Посмотреть все треки автора', callback_data: `allTracks_${song.idAuthor}` }],
          ],
        },
        parse_mode: 'Markdown',
      };
      bot.deleteMessage(chatId, TimeMessageId)
      bot.sendMessage(chatId, text, inlineKeyboard);
    } else{
      await all_authors_inArray(author_matches[0], chatId)
        await all_tracks_inArray(track_matches, chatId)
        const inlineKeyboard = {
          reply_markup: {
            inline_keyboard: [
              [{ text: 'Автор', callback_data: `author` }],
              [{ text: 'Трек', callback_data: `tracks` }],
              [{ text: 'Поиск песни по тексту', callback_data: `text_${userInput.trim()}` }],
            ],
          },
        };
        bot.deleteMessage(chatId, TimeMessageId)
        bot.sendMessage(chatId, 'Что вы ищите? Ответьте нажатием на кнопку:', inlineKeyboard);
        return
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

function lenArray_tracks(message) {
  for (const tracks of all_tracks) {
    if (Number(message) > tracks[0].length) {
      return false;
    } else {
      return true;
    }
  }
  return false;
}

async function flagAdd(id, tag) {
  for (const fl of flag) {
    if ( fl[1] == id ){
      fl[0] = tag
      return
    } 
  }
  flag.push([tag, id])
}

async function returnAuthorId(chat_id) {
  for (const author of all_authors) {
    if (parseInt(author[1]) == chat_id) {
      try{
        const id = author[0]._id;
        if (id){
          return id
        }
      }
      catch {
        return null
      }
    }
  }
}

async function returnSoundTrack(message, chat_id) {
  for (const tracks of all_tracks_author) {
    if (parseInt(tracks[1]) == chat_id) {
      return [tracks[0][Number(message) - 1]._id, tracks[0][Number(message) - 1].autor];
    }
  }
}



async function returnTrackNumber(message, chat_id) {
  for (const tracks of all_tracks) {
    if (parseInt(tracks[1]) == chat_id) {
      return [tracks[0][Number(message) - 1]._id, tracks[0][Number(message) - 1].autor];
    }
  }
}

async function returnTrack(chat_id) {
  for (const tracks of all_tracks) {
    if (parseInt(tracks[1]) == chat_id) {
      return tracks[0];
    }
  }
}
async function returnTrackText(chat_id) {
  for (const tracks of all_text) {
    if (parseInt(tracks[1]) == chat_id) {
      return tracks[0];
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

async function all_authors_inArray(array, chatId) {
  let count = 0;
  for (let i = 0; i < all_authors.length; i++) {
    if (all_authors[i][1] === chatId) {
      all_authors[i][0] = array;
      count++;
      break;
    }
  }
  if (count === 0) {
    all_authors.push([array, chatId]);
  }
}

async function all_tracks_inArray(array, chatId) {
  let count = 0;
  for (let i = 0; i < all_tracks.length; i++) {
    if (all_tracks[i][1] === chatId) {
      all_tracks[i][0] = array;
      count++;
      break;
    }
  }
  if (count === 0) {
    all_tracks.push([array, chatId]);
  }
}

async function showTextTracks(chatId, page = 1, tracksPerPage = 15, messageId = null){
  try{
    const alltracks = await returnTrackText(chatId)
    console.log(alltracks)
    const startIndex = (page - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const currentTracks = alltracks.slice(startIndex, endIndex);
    let tracks = 'Напишите номер песни, для получения информации: \n \n'
    for (let i=startIndex; i<currentTracks.length + startIndex; i++){
      const idAuthor = new ObjectId(currentTracks[i-startIndex].autor)
      const author = await mongo_author_collection.findOne({ _id: idAuthor });
      if (author){
        tracks+=`${i + 1}. ${author.name} - ${currentTracks[i-startIndex].name}\n`
      }
    }
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [],
      },
    };

    if (startIndex > 0) {
      inlineKeyboard.reply_markup.inline_keyboard.push([{ text: 'Назад', callback_data: `backText_${page}` }]);
    }

    if (endIndex < alltracks.length) {
      inlineKeyboard.reply_markup.inline_keyboard.push([{ text: 'Далее', callback_data: `goText_${page}` }]);
    }
    if (messageId) {
        await bot.editMessageText(tracks,{
            chat_id: chatId, 
            message_id: messageId,
            parse_mode: 'Markdown',
            ...inlineKeyboard 
        });
    } else {
      await bot.sendMessage(chatId, tracks, inlineKeyboard);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
  }
}

async function showAllTracks(chatId, page = 1, tracksPerPage = 15, messageId = null){
  try{
    const alltracks = await returnTrack(chatId)
    if (alltracks.length === 0){
      bot.sendMessage(chatId, "Трек не найден");
      return
    }
    const startIndex = (page - 1) * tracksPerPage;
    const endIndex = startIndex + tracksPerPage;
    const currentTracks = alltracks.slice(startIndex, endIndex);
    let tracks = 'Напишите номер песни, для получения информации: \n \n'
    for (let i=startIndex; i<currentTracks.length + startIndex; i++){
      const idAuthor = new ObjectId(currentTracks[i-startIndex].autor)
      const author = await mongo_author_collection.findOne({ _id: idAuthor });
      if (author){
        tracks+=`${i + 1}. ${author.name} - ${currentTracks[i-startIndex].name}\n`
      }
    }
    const inlineKeyboard = {
      reply_markup: {
        inline_keyboard: [],
      },
    };

    if (startIndex > 0) {
      inlineKeyboard.reply_markup.inline_keyboard.push([{ text: 'Назад', callback_data: `backText_${page}` }]);
    }

    if (endIndex < alltracks.length) {
      inlineKeyboard.reply_markup.inline_keyboard.push([{ text: 'Далее', callback_data: `goText_${page}` }]);
    }
    if (messageId) {
        await bot.editMessageText(tracks,{
            chat_id: chatId, 
            message_id: messageId,
            parse_mode: 'Markdown',
            ...inlineKeyboard 
        });
    } else {
      await bot.sendMessage(chatId, tracks, inlineKeyboard);
    }
  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, "Уп-с, ошибка, сообщите о ней @knexy");
  }
}

async function showAllTracksByAuthor(chatId, authorId, page = 1, tracksPerPage = 15, messageId = null) {
  try {
    if (!authorId){
      bot.sendMessage(chatId, 'Такого автора не существует');
      return;
    }
    const idAuthor = new ObjectId(authorId)
    const author = await mongo_author_collection.findOne({ _id: idAuthor });
    const allTracks = await mongo_song_collection.find({ autor: idAuthor }).toArray();

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

    let trackMessage = 'Напишите номер песни, для получения информации: \n \n';
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
        await flagAdd(call.message.chat.id, 0)
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
      else if(call.data.startsWith('author')){
        await flagAdd(call.message.chat.id, 0)
        const authorId = await returnAuthorId(call.message.chat.id)
        await showAllTracksByAuthor(call.message.chat.id, authorId);
      }
      else if(call.data.startsWith('tracks')){
        await flagAdd(call.message.chat.id, 1)
        await showAllTracks(call.message.chat.id)
      }
      else if (call.data.startsWith('go_') || call.data.startsWith('back_')) {
        const page = parseInt(callbackDataParts[1]);
        if (call.data.startsWith('go_')) {
          await showAllTracks(call.message.chat.id, page + 1, 15, call.message.message_id);
        } else if (call.data.startsWith('back_')) {
          await showAllTracks(call.message.chat.id, Math.max(1, page - 1), 15, call.message.message_id);
        }
      }
      else if (call.data.startsWith('goText_') || call.data.startsWith('backText_')) {
        const page = parseInt(callbackDataParts[1]);
        if (call.data.startsWith('goText_')) {
          await showTextTracks(call.message.chat.id, page + 1, 15, call.message.message_id);
        } else if (call.data.startsWith('backText_')) {
          await showTextTracks(call.message.chat.id, Math.max(1, page - 1), 15, call.message.message_id);
        }
      }
      else if (call.data.startsWith('text_')){
        const text = callbackDataParts[1];
        const textr = await clearText(text)
        const track_query = { text: { $regex: (textr || text), $options: 'i' } }
        const traks = await mongo_song_collection.find(track_query).toArray();
        let g = false
        for (const tr of all_text){
          if (tr[1] == call.message.chat.id){
            tr[0] = traks
            g = true
            break
          }
        }
        if (g==false){
          all_text.push([traks, call.message.chat.id])
          all_tracks_author.push([traks, call.message.chat.id])
        }
        await flagAdd(call.message.chat.id, 0)
        await showTextTracks(call.message.chat.id)
      }

    } catch (error) {
      console.error(error);
      await bot.sendMessage(call.message.chat.id, "Уп-с, ошибка, сообщите о ней @knexy");
    }
  });

async function clearText(text){
  let newText = ''
  for (let i = 0; i<text.length; i++){
    if (text[i]!=',' && text[i]!='.' && text[i]!='?' && text[i]!='!' && text[i]!='-' && text[i]!=']'){
      newText += text[i]
    }
  }
  return newText
}


async function showChordsWithPhotos(chatId, trackId) {
  try {
    const idTrack = new ObjectId(trackId);
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
      await bot.sendMessage(chatId, 'No chords to send.');
      return;
    }

    const mediaGroup = allAccords.map(accord => {
      let filePath = path.join(__dirname, 'public', accord.media.replace(/\\/g, '/')); // Конвертация пути
      return {
        type: 'photo',
        media: filePath, // Использование строки пути
        caption: accord.name,
      };
    });

    console.log('Media Group:', mediaGroup);

    await bot.sendMediaGroup(chatId, mediaGroup);
  } catch (error) {
    console.error('Error:', error);
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