import { ObjectId } from "mongoose";

export interface ITrack {
  _id: ObjectId;
  name: string;
  name1: string;
  author: {
    _id: ObjectId;
    name: string;
    name1: string;
  },
  text: string;
}

export interface IChord {
  _id: ObjectId,
  idSong: ObjectId,
  unBare: number,
  idChord: {
    _id: ObjectId,
    photo: string,
    name: string,
  }
} 