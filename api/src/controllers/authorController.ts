import { Request, Response } from 'express';
import { Author } from '../models';

// Получить всех авторов
export const getAllAuthors = async (req: Request, res: Response) => {
  try {
    const authors = await Author.find();
    res.status(200).json(authors);
  } catch (error) {
    console.error('Ошибка при получении авторов:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении авторов' });
  }
};  

// Получить автора по ID
export const getAuthorById = async (req: Request, res: Response) => {
  try {
    const author = await Author.findById(req.params.id);
    
    if (!author) {
      return res.status(404).json({ message: 'Автор не найден' });
    }
    
    res.status(200).json(author);
  } catch (error) {
    console.error('Ошибка при получении автора:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении автора' });
  }
};

// Получить автора по имени
export const getAuthorByName = async (req: Request, res: Response) => {
  try {
    const authorName = req.params.name;

    if (!authorName) {
      return res.status(400).json({ message: 'Необходимо указать имя автора' });
    }
    
    const author = await Author.findOne({ 
      $or: [
        { name: authorName }, 
        { name1: authorName }
      ] 
    });
    
    if (!author) {
      return res.status(404).json({ message: 'Автор не найден' });
    }
    
    res.status(200).json(author);
  } catch (error) {
    console.error('Ошибка при получении автора по имени:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении автора по имени' });
  }
};

// Создать нового автора
export const createAuthor = async (req: Request, res: Response) => {
  try {
    const { name, name1 } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Необходимо указать имя автора' });
    }
    
    const newAuthor = new Author({ name, name1 });
    const savedAuthor = await newAuthor.save();
    
    res.status(201).json(savedAuthor);
  } catch (error) {
    console.error('Ошибка при создании автора:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании автора' });
  }
};

// Обновить автора
export const updateAuthor = async (req: Request, res: Response) => {
  try {
    const { name, name1 } = req.body;
    
    const updatedAuthor = await Author.findByIdAndUpdate(
      req.params.id,
      { name, name1 },
      { new: true }
    );
    
    if (!updatedAuthor) {
      return res.status(404).json({ message: 'Автор не найден' });
    }
    
    res.status(200).json(updatedAuthor);
  } catch (error) {
    console.error('Ошибка при обновлении автора:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении автора' });
  }
};

// Удалить автора
export const deleteAuthor = async (req: Request, res: Response) => {
  try {
    const deletedAuthor = await Author.findByIdAndDelete(req.params.id);
    
    if (!deletedAuthor) {
      return res.status(404).json({ message: 'Автор не найден' });
    }
    
    res.status(200).json({ message: 'Автор успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении автора:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении автора' });
  }
}; 