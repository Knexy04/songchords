import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name1: { type: String, required: true },
});

export default mongoose.model('Author', AuthorSchema, 'author');
