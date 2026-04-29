const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/usuarios',   require('./routes/Usuarios/usuarios.routes.js'));
app.use('/api/categorias', require('./routes/categorias/categorias.routes.js'));
app.use('/api/descuentos', require('./routes/descuentos/descuentos.routes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));