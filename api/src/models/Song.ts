import mongoose from "mongoose";

const SongSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name1: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'Author', required: true },
  text: { type: String }
});

// Создаем индекс для текстового поиска
SongSchema.index({ text: 'text' });

export interface ISong {
  _id: mongoose.Types.ObjectId;
  name: string;
  name1?: string;
  author: mongoose.Types.ObjectId;
  text?: string;
}

export default mongoose.model('Song', SongSchema, 'song'); 