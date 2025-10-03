// index.js
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const User = require('./models/User');
const Account = require('./models/Account');
const Transaction = require('./models/Transaction');

// Importar los routers
const authRoutes = require('./routes/auth');
const accountRoutes = require('./routes/accounts');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware para procesar JSON
app.use(express.json());

// Middleware de Seguridad (Helmet)
app.use(helmet());
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "http://localhost:3000"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  })
);

// Opciones de configuración de Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Bancaria RESTful',
            version: '1.0.0',
            description: 'Una API para la gestión de usuarios, cuentas y transacciones bancarias.'
        },
        servers: [
            {
                url: 'https://tallerrestful-production.up.railway.app'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./routes/*.js'] // Ahora apunta a todos los archivos .js en la carpeta routes
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Manejar la petición del favicon
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Ruta de inicio para evitar el 404
app.get('/', (req, res) => {
  res.send('API RESTful Bancaria - Servidor en funcionamiento.');
});

// **********************************
// Usar los routers modulares
// **********************************
app.use('/auth', authRoutes);
app.use('/accounts', accountRoutes);

// Conexión a MongoDB Atlas
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Conectado a MongoDB Atlas');
}).catch(err => {
    console.error('Error al conectar a la base de datos', err);
    process.exit(1);
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});