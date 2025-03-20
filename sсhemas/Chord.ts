import mongoose from "mongoose";

const ChordSchema = new mongoose.Schema({
  photo: { type: String, required: true },
  name: { type: String, required: true },
});

export default mongoose.model('Chord', ChordSchema, 'chord');
