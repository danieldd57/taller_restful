// index.js
import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import accountRoutes from './routes/accounts';


dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

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
    apis: ['./routes/*.js'] 
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

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error('❌ Error: la variable MONGO_URI no está definida en el archivo .env');
  process.exit(1); // detiene la ejecución
}

mongoose.connect(mongoUri)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});