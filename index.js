const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'libros.json');

app.use(express.json());

const readBooksData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error('Error al leer los datos de libros');
  }
};

const writeBooksData = async (books) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(books, null, 2));
  } catch (error) {
    throw new Error('Error al guardar los datos de libros');
  }
};

const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

app.get('/api/libros', async (req, res) => {
  try {
    const books = await readBooksData();
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/libros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const books = await readBooksData();
    const book = books.find(b => b.id === id);
    
    if (!book) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/libros', async (req, res) => {
  try {
    const { title, author, year } = req.body;

    if (!title || !author) {
      return res.status(400).json({ 
        error: 'Los campos titulo y autor son obligatorios' 
      });
    }
    
    if (typeof title !== 'string' || typeof author !== 'string') {
      return res.status(400).json({ 
        error: 'Titulo y autor no validos' 
      });
    }
    
    if (year && (typeof year !== 'number' || year < 0 || year > new Date().getFullYear())) {
      return res.status(400).json({ 
        error: 'El año debe ser un número válido' 
      });
    }
    
    const books = await readBooksData();
    
    const existingBook = books.find(book => 
      book.title.toLowerCase() === title.toLowerCase() && 
      book.year === year
    );
    
    if (existingBook) {
      return res.status(409).json({ 
        error: 'Ya existe un libro con el mismo título y año' 
      });
    }
    
    const newBook = {
      id: uuidv4(),
      title: title.trim(),
      author: author.trim(),
      year: year || null
    };
    
    books.push(newBook);
    await writeBooksData(books);
    
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/libros/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    const books = await readBooksData();
    const bookIndex = books.findIndex(b => b.id === id);
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Libro no encontrado' });
    }
    
    const deletedBook = books.splice(bookIndex, 1)[0];
    await writeBooksData(books);
    
    res.status(200).json({ 
      message: 'Libro eliminado correctamente',
      book: deletedBook 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a la API de Biblioteca Aurora',
    endpoints: {
      getAll: 'GET /api/libros',
      getById: 'GET /api/libros/:id',
      create: 'POST /api/libros',
      delete: 'DELETE /api/libros/:id'
    }
  });
});

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en este servidor`,
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
