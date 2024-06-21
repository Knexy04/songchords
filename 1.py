import pymysql
from pymongo import MongoClient, InsertOne
from pymongo.errors import AutoReconnect
import time

# Подключение к MongoDB
mongo_client = MongoClient('mongodb+srv://knexy:vvevIsAvTh2B3Jt4@wtf.90qwju6.mongodb.net/', connectTimeoutMS=30000, socketTimeoutMS=30000)
mongo_db = mongo_client['songs']

# Коллекции MongoDB
accord_collection = mongo_db['accord']
song_collection = mongo_db['song']
song_accord_collection = mongo_db['songaccord']
autor_collection = mongo_db['autor']

# Подключение к MySQL
mysql_connection = pymysql.connect(
    host='localhost',
    user='admin',
    password='kawasakiversys650.POVARESHKA!zxc',
    database='songs'
)

def bulk_write_with_retry(collection, operations):
    max_retries = 5
    for attempt in range(max_retries):
        try:
            if operations:
                collection.bulk_write(operations)
            break
        except AutoReconnect as e:
            if attempt < max_retries - 1:
                print(f"AutoReconnect error: {e}. Retrying in 5 seconds...")
                time.sleep(5)
            else:
                print(f"Failed after {max_retries} attempts")
                raise

# Функция для миграции данных
def migrate_data():
    try:
        with mysql_connection.cursor() as cursor:
            # Перенос данных из таблицы autor
            cursor.execute('SELECT * FROM autor')
            autors = cursor.fetchall()
            autor_map = {}
            autor_operations = []
            for autor in autors:
                new_autor = {
                    'name': autor[1],
                    'name1': autor[2]
                }
                autor_operations.append(InsertOne(new_autor))
                autor_map[autor[0]] = new_autor

            bulk_write_with_retry(autor_collection, autor_operations)

            autor_id_map = {autor['name']: autor['_id'] for autor in autor_collection.find()}

            # Перенос данных из таблицы accord
            cursor.execute('SELECT * FROM accord')
            accords = cursor.fetchall()
            accord_map = {}
            accord_operations = []
            for accord in accords:
                new_accord = {
                    'photo': accord[1],
                    'name': accord[2]
                }
                accord_operations.append(InsertOne(new_accord))
                accord_map[accord[0]] = new_accord

            bulk_write_with_retry(accord_collection, accord_operations)

            accord_id_map = {accord['name']: accord['_id'] for accord in accord_collection.find()}

            # Перенос данных из таблицы song
            cursor.execute('SELECT * FROM song')
            songs = cursor.fetchall()
            song_map = {}
            song_operations = []
            for song in songs:
                if song[4] is not None and song[4] in autor_map:
                    autor_id = autor_id_map[autor_map[song[4]]['name']]
                else:
                    autor_id = None
                    print(f"Warning: Missing author for song ID {song[0]}")

                new_song = {
                    'name': song[1],
                    'name1': song[2],
                    'text': song[3],
                    'autor': autor_id,  # Преобразование id автора
                    'textUnBare': song[5]
                }
                song_operations.append(InsertOne(new_song))
                song_map[song[0]] = new_song

            bulk_write_with_retry(song_collection, song_operations)

            song_id_map = {song['name']: song['_id'] for song in song_collection.find()}

            # Перенос данных из таблицы songaccord
            cursor.execute('SELECT * FROM songaccord')
            song_accords = cursor.fetchall()
            song_accord_operations = []
            for song_accord in song_accords:
                if song_accord[1] in song_map and song_accord[2] in accord_map:
                    new_song_accord = {
                        'idSong': song_id_map[song_map[song_accord[1]]['name']],  # Преобразование id песни
                        'idAccord': accord_id_map[accord_map[song_accord[2]]['name']],  # Преобразование id аккорда
                        'unBare': song_accord[3]
                    }
                    song_accord_operations.append(InsertOne(new_song_accord))
                else:
                    print(f"Warning: Missing song or accord for songaccord ID {song_accord[0]}")

            bulk_write_with_retry(song_accord_collection, song_accord_operations)

        print('Data migration completed!')
    finally:
        mysql_connection.close()
        mongo_client.close()

# Запуск функции миграции данных
migrate_data()
