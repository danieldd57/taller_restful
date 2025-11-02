import express, { Response } from 'express';
import verifyToken, { AuthRequest } from '../middleware/verifyToken';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

const router = express.Router();

// Obtener todas las cuentas del usuario 
router.get('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any)?.userId;

    if (!userId) {
      return res.status(403).json({ message: 'Token inválido o ausente.' });
    }
    const accounts = await Account.find({ propietario: userId }).select('-__v');

    res.status(200).json(accounts);
  } catch (err: any) {
    res.status(500).json({ message: 'Error al obtener las cuentas del usuario.', error: err.message });
  }
});

// Crear nueva cuenta
router.post('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any)?.userId;
    const { nombre, saldoInicial } = req.body;

    if (!userId) {
      return res.status(403).json({ message: 'Token inválido o ausente.' });
    }

    const nuevaCuenta = new Account({
      propietario: userId,
      nombre,
      saldo: saldoInicial || 0,
    });

    await nuevaCuenta.save();
    res.status(201).json(nuevaCuenta);
  } catch (err: any) {
    res.status(500).json({ message: 'Error al crear la cuenta.', error: err.message });
  }
});

// Realizar transacción (depósito o retiro)
router.post('/:accountId/transactions', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any)?.userId;
    const { accountId } = req.params;
    const { tipo, monto, descripcion } = req.body;

    if (!userId) {
      return res.status(403).json({ message: 'Token inválido o ausente.' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada.' });
    }

    if (account.propietario.toString() !== userId) {
      return res.status(403).json({ message: 'No tiene permiso para operar en esta cuenta.' });
    }

    if (tipo === 'Retiro' && account.saldo < monto) {
      return res.status(400).json({ message: 'Fondos insuficientes.' });
    }

    const nuevoSaldo = tipo === 'Depósito' ? account.saldo + monto : account.saldo - monto;

    const transaccion = new Transaction({
      tipo,
      monto,
      descripcion,
      cuentaId: account._id,
    });

    await transaccion.save();
    await Account.findByIdAndUpdate(accountId, { saldo: nuevoSaldo });

    res.status(201).json(transaccion);
  } catch (err: any) {
    res.status(500).json({ message: 'Error al procesar la transacción.', error: err.message });
  }
});

// Obtener historial de transacciones
router.get('/:accountId/transactions', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any)?.userId;
    const { accountId } = req.params;

    if (!userId) {
      return res.status(403).json({ message: 'Token inválido o ausente.' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada.' });
    }

    if (account.propietario.toString() !== userId) {
      return res.status(403).json({ message: 'No tiene permiso para ver las transacciones de esta cuenta.' });
    }

    const transacciones = await Transaction.find({ cuentaId: accountId }).sort({ fecha: -1 });
    res.json(transacciones);
  } catch (err: any) {
    res.status(500).json({ message: 'Error al obtener las transacciones.', error: err.message });
  }
});

// Eliminar cuenta
router.delete('/:accountId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.user as any)?.userId;
    const { accountId } = req.params;

    if (!userId) {
      return res.status(403).json({ message: 'Token inválido o ausente.' });
    }

    const account = await Account.findById(accountId);
    if (!account) {
      return res.status(404).json({ message: 'Cuenta no encontrada.' });
    }

    if (account.propietario.toString() !== userId) {
      return res.status(403).json({ message: 'No tiene permiso para eliminar esta cuenta.' });
    }

    if (account.saldo !== 0) {
      return res.status(400).json({ message: 'No se puede eliminar una cuenta con saldo positivo.' });
    }

    await Transaction.deleteMany({ cuentaId: accountId });
    await Account.findByIdAndDelete(accountId);

    res.status(200).json({ message: 'Cuenta eliminada con éxito.' });
  } catch (err: any) {
    res.status(500).json({ message: 'Error al eliminar la cuenta.', error: err.message });
  }
});

export default router;