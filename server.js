const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const cors = require('cors');
require('dotenv').config(); 

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para JSON
app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(express.static('public'));
const exampleRoutes = require('./routes/example.js');
app.use('/api/participants', exampleRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Swagger disponible en http://localhost:${PORT}/api-docs`);
});