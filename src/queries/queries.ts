import { ObjectId } from 'mongodb';
import { IChord, ITrack } from '../interfaces';
import Author from '../../sсhemas/Author';
import Song from '../../sсhemas/Song';
import Songchord from '../../sсhemas/Songchord';
import Chord from '../../sсhemas/Chord';

export const queries = () => {
  const getAuthorByName = async (authorName: string) => {
    return await Author.findOne({ $or: [{ name: authorName }, { name1: authorName }] });
  };

  const getTracksByAuthor = async (authorId: ObjectId): Promise<ITrack[]> => {
    return await Song.find({ author: authorId }).populate('author').lean() as unknown as ITrack[];
  };

  const getTracksByText = async (text: string): Promise<ITrack[]> => {
    await Song.createIndexes();
    return await Song.find({ text: { $regex: text, $options: 'i' } }).populate('author').lean() as unknown as ITrack[];
  };

  const getTracksByName = async (songName: string): Promise<ITrack[]> => {
    return await Song.find({ $or: [{ name: songName }, { name1: songName }] }).populate('author').lean() as unknown as ITrack[];
  };

  const getTracksByDto = async (authorName: string, songName: string): Promise<ITrack[]> => {
    const author = await Author.findOne({ name: authorName }).lean();
    if (!author) return [];
    return await Song.find({ $and: [{ $or: [{ name: songName }, { name1: songName }] }, { author: author._id }] }).populate('author').lean() as unknown as ITrack[];
  };

  const getChordsByTrackId = async (trackId: string) => {
    Chord.createIndexes();
    return await Songchord.find({ idSong: trackId }).populate('idChord').lean() as unknown as IChord[];
  };

  return { getAuthorByName, getTracksByAuthor, getTracksByText, getTracksByName, getTracksByDto, getChordsByTrackId };
};