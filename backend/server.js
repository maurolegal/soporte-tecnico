const express = require('express');
const mongoose = require('mongoose');
const app = express();
require('dotenv').config();

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

// Ruta básica para tickets
app.get('/api/tickets', (req, res) => {
  res.json({ message: "Lista de tickets" });
});

app.listen(3000, () => console.log('Servidor en puerto 3000')); 