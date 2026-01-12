
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Conexiunea la MongoDB Atlas
 */
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jconstantajiva_db_user:hBjbBJiZY7BZq6UN@cluster0.rk4klxk.mongodb.net/SmartContact?retryWrites=true&w=majority&appName=Cluster0";

console.log('--- STARTUP SYSTEM ---');
console.log('Tentativă conectare la MongoDB...');

// Dezactivăm buffering-ul pentru a primi erori imediat ce baza de date e apelată dacă nu e conectată
mongoose.set('bufferCommands', false);

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000 // Așteaptă maxim 5 secunde pentru selecția serverului
})
  .then(() => {
    console.log('✅ STATUS: MongoDB Conectat cu succes.');
  })
  .catch(err => {
    console.error('❌ EROARE CRITICĂ MONGODB:', err.message);
    if (err.message.includes('IP not whitelisted') || err.message.includes('queryTxt ETIMEOUT')) {
        console.error('SFAT: Verifică "Network Access" în MongoDB Atlas. Trebuie să adaugi IP-ul 0.0.0.0/0');
    }
  });

// Definirea Modelului
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  createdAt: { type: Number, default: Date.now }
});

contactSchema.method('toJSON', function() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Contact = mongoose.model('Contact', contactSchema);

// API: Verificare rapidă dacă DB e online
app.get('/api/health', (req, res) => {
  res.json({ 
    db: mongoose.connection.readyState === 1 ? 'online' : 'offline',
    mode: process.env.NODE_ENV || 'production'
  });
});

// API: Obținerea tuturor contactelor
app.get('/api/contacts', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Baza de date nu este conectată încă.' });
  }
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Eroare la citirea datelor.' });
  }
});

// API: Adăugarea unui contact
app.post('/api/contacts', async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'Baza de date este deconectată.' });
  }
  const contact = new Contact({
    name: req.body.name,
    address: req.body.address,
    createdAt: req.body.createdAt || Date.now()
  });

  try {
    const newContact = await contact.save();
    res.status(201).json(newContact);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Ștergere
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    await Contact.findByIdAndDelete(req.params.id);
    res.json({ message: 'OK' });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la ștergere' });
  }
});

app.use(express.static(path.join(__dirname, '.')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server activ pe portul ${PORT}`);
});
