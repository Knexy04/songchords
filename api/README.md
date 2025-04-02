# SongChord API

API сервер для работы с аккордами песен.

## Установка

```bash
# Клонирование репозитория
git clone <repository-url>

# Установка зависимостей
npm install

# Создание файла .env с переменными окружения
# PORT=3000
# MONGO_URL=mongodb+srv://...
# DB_NAME=songs
```

## Запуск

```bash
# Режим разработки
npm run dev

# Сборка
npm run build

# Запуск production-версии
npm start
```

## API Endpoints

### Аккорды

- `GET /api/chords` - получить все аккорды
- `GET /api/chords/:id` - получить аккорд по ID
- `POST /api/chords` - создать новый аккорд
  - Тело запроса: `{ "name": "C", "photo": "url_to_photo" }`
- `PUT /api/chords/:id` - обновить аккорд
  - Тело запроса: `{ "name": "C#", "photo": "new_url_to_photo" }`
- `DELETE /api/chords/:id` - удалить аккорд

### Авторы

- `GET /api/authors` - получить всех авторов
- `GET /api/authors/:id` - получить автора по ID
- `GET /api/authors/name/:name` - получить автора по имени
- `POST /api/authors` - создать нового автора
  - Тело запроса: `{ "name": "Цой", "name1": "Viktor Tsoi" }`
- `PUT /api/authors/:id` - обновить автора
- `DELETE /api/authors/:id` - удалить автора

### Песни

- `GET /api/songs` - получить все песни
- `GET /api/songs/:id` - получить песню по ID
- `GET /api/songs/author/:authorId` - получить песни по ID автора
- `GET /api/songs/search/text?text=query` - поиск песен по тексту
- `GET /api/songs/search/name?name=query` - поиск песен по названию
- `GET /api/songs/search/dto?authorName=name&songName=name` - поиск песен по автору и названию
- `POST /api/songs` - создать новую песню
  - Тело запроса: `{ "name": "Кукушка", "author": "authorId", "text": "lyrics" }`
- `PUT /api/songs/:id` - обновить песню
- `DELETE /api/songs/:id` - удалить песню

### Связи песен с аккордами

- `GET /api/songchords` - получить все связи
- `GET /api/songchords/:id` - получить связь по ID
- `GET /api/songchords/track/:trackId` - получить аккорды по ID песни
- `POST /api/songchords` - создать новую связь
  - Тело запроса: `{ "idSong": "songId", "idChord": "chordId" }`
- `PUT /api/songchords/:id` - обновить связь
- `DELETE /api/songchords/:id` - удалить связь 