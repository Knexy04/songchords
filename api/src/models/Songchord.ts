import mongoose from "mongoose";

const SongchordSchema = new mongoose.Schema({
  idSong: { type: mongoose.Schema.Types.ObjectId, required: true },
  idChord: { type: mongoose.Schema.Types.ObjectId, ref: 'Chord', required: true }
});

export interface ISongchord {
  _id: mongoose.Types.ObjectId;
  idSong: mongoose.Types.ObjectId;
  idChord: string;
}

export default mongoose.model('Songchord', SongchordSchema, 'songchord'); 