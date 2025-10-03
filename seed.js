// seed.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Account = require('./models/Account');
const Transaction = require('./models/Transaction');

const runSeed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB Atlas para seed.');

        // 1. Eliminar datos existentes
        console.log('Eliminando datos existentes...');
        await User.deleteMany({});
        await Account.deleteMany({});
        await Transaction.deleteMany({});
        console.log('Datos eliminados.');

        // 2. Crear un usuario de prueba
        console.log('Creando usuario de prueba...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        const user = await User.create({
            nombre: 'Juan Pérez',
            email: 'juan.perez@test.com',
            password: hashedPassword,
        });
        console.log(`Usuario de prueba creado con el ID: ${user._id}`);

        // 3. Crear una cuenta para el usuario
        console.log('Creando cuenta de ahorros...');
        const account = await Account.create({
            tipo: 'Ahorros',
            propietario: user._id,
            saldo: 1000,
        });
        console.log(`Cuenta de ahorros creada con el ID: ${account._id}`);

        // 4. Crear transacciones de prueba
        console.log('Creando transacciones de prueba...');
        await Transaction.create([
            {
                tipo: 'Depósito',
                monto: 500,
                descripcion: 'Depósito inicial',
                cuentaId: account._id,
            },
            {
                tipo: 'Retiro',
                monto: 200,
                descripcion: 'Retiro en cajero',
                cuentaId: account._id,
            },
            {
                tipo: 'Depósito',
                monto: 700,
                descripcion: 'Depósito de nómina',
                cuentaId: account._id,
            },
        ]);
        console.log('Transacciones creadas.');

        console.log('Proceso de seeding completado.');

    } catch (error) {
        console.error('Error durante el seeding:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB.');
    }
};

runSeed();