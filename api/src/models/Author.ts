import mongoose from "mongoose";

const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  name1: { type: String }
});

export interface IAuthor {
  _id: mongoose.Types.ObjectId;
  name: string;
  name1?: string;
}

export default mongoose.model('Author', AuthorSchema, 'author'); 