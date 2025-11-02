import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET as string;

// Registrar usuario
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { nombre, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ nombre, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  } catch (err: any) {
    res.status(500).json({ message: 'Error al registrar el usuario.', error: err.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }) as (mongoose.Document<unknown, any, IUser> & IUser & { _id: mongoose.Types.ObjectId });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta.' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
        process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ message: 'Error en el login.', error: err.message });
  }
});

export default router;
