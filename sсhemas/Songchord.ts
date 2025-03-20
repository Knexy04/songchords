import mongoose from "mongoose";

const SongChordSchema = new mongoose.Schema({
  idSong: { type: mongoose.Schema.Types.ObjectId, ref: 'Song' },
  idChord: { type: mongoose.Schema.Types.ObjectId, ref: 'Chord' },
});

export default mongoose.model('Songchord', SongChordSchema, 'songchord');
