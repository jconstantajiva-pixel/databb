
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
 * Am adăugat baza de date 'SmartContact' în path-ul conexiunii pentru a izola datele aplicației.
 */
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://jconstantajiva_db_user:hBjbBJiZY7BZq6UN@cluster0.rk4klxk.mongodb.net/SmartContact?retryWrites=true&w=majority&appName=Cluster0";

console.log('Se inițiază conexiunea la MongoDB...');

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ CONECTAT: Aplicația este legată cu succes la MongoDB Atlas (Cluster0)');
  })
  .catch(err => {
    console.error('❌ EROARE CONEXIUNE:', err.message);
    console.log('Sfat: Verifică dacă IP-ul curent este adăugat în "Network Access" în MongoDB Atlas (0.0.0.0/0 pentru acces universal).');
  });

// Definirea Modelului pentru Contacte
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  createdAt: { type: Number, default: Date.now }
});

/**
 * Mongoose returnează implicit _id. 
 * Această metodă transformă _id în id pentru ca frontend-ul React să funcționeze corect fără modificări.
 */
contactSchema.method('toJSON', function() {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

const Contact = mongoose.model('Contact', contactSchema);

// Endpoint pentru verificarea stării sistemului
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    serverTime: new Date().toISOString()
  });
});

// API: Obținerea tuturor contactelor (cele mai recente primele)
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Nu s-au putut încărca datele din baza de date.' });
  }
});

// API: Adăugarea unui contact nou
app.post('/api/contacts', async (req, res) => {
  const contact = new Contact({
    name: req.body.name,
    address: req.body.address,
    createdAt: req.body.createdAt || Date.now()
  });

  try {
    const newContact = await contact.save();
    console.log(`Contact salvat: ${newContact.name}`);
    res.status(201).json(newContact);
  } catch (err) {
    res.status(400).json({ error: 'Date invalide. Numele și adresa sunt obligatorii.' });
  }
});

// API: Ștergerea unui contact după ID
app.delete('/api/contacts/:id', async (req, res) => {
  try {
    const result = await Contact.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ error: 'Contactul nu a fost găsit în baza de date.' });
    }
    console.log(`Contact șters: ${req.params.id}`);
    res.json({ message: 'Contact eliminat cu succes.' });
  } catch (err) {
    res.status(500).json({ error: 'Eroare la ștergerea datelor.' });
  }
});

// Servire fișiere statice (Frontend)
app.use(express.static(path.join(__dirname, '.')));

// Suport pentru Single Page Application (Redirect către index.html pentru rute necunoscute)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`--------------------------------------------------`);
  console.log(`🚀 Serverul SmartContact este activ pe portul ${PORT}`);
  console.log(`📂 Interfață: http://localhost:${PORT}`);
  console.log(`--------------------------------------------------`);
});
