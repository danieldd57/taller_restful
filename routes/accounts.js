// routes/accounts.js
const express = require('express');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

/**
 * @swagger
 * /accounts:
 *   get:
 *     summary: Obtiene todas las cuentas del usuario autenticado
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: Lista de cuentas del usuario
 *       '403':
 *         description: Se requiere un token de acceso
*/
router.get('/', verifyToken, async (req, res) => {
    try {
        const accounts = await Account.find({ propietario: req.user.userId });
        res.json(accounts);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener las cuentas.', error: err.message });
    }
});

/**
 * @swagger
 * /accounts:
 *   post:
 *     summary: Crea una nueva cuenta para el usuario autenticado
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Cuenta creada con éxito
*/
router.post('/', verifyToken, async (req, res) => {
    try {
        const { tipo } = req.body;
        const account = new Account({
            tipo,
            propietario: req.user.userId,
            saldo: 0,
        });
        await account.save();
        res.status(201).json(account);
    } catch (err) {
        res.status(500).json({ message: 'Error al crear la cuenta.', error: err.message });
    }
});

/**
 * @swagger
 * /accounts/{accountId}/transactions:
 *   post:
 *     summary: Realiza una nueva transacción en una cuenta
 *     tags: [Transacciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: El ID de la cuenta bancaria
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tipo:
 *                 type: string
 *               monto:
 *                 type: number
 *               descripcion:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Transacción realizada con éxito
*/
router.post('/:accountId/transactions', verifyToken, async (req, res) => {
    try {
        const { accountId } = req.params;
        const { tipo, monto, descripcion } = req.body;

        const account = await Account.findById(accountId);
        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada.' });
        }
        if (account.propietario.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'No tiene permiso para realizar transacciones en esta cuenta.' });
        }
        
        if (tipo === 'Retiro' && account.saldo < monto) {
            return res.status(400).json({ message: 'Fondos insuficientes.' });
        }
        
        const newSaldo = tipo === 'Depósito' ? account.saldo + monto : account.saldo - monto;
        
        const transaction = new Transaction({
            tipo,
            monto,
            descripcion,
            cuentaId: account._id,
        });
        
        await transaction.save();
        await Account.findByIdAndUpdate(accountId, { saldo: newSaldo });
        
        res.status(201).json(transaction);
        
    } catch (err) {
        res.status(500).json({ message: 'Error al procesar la transacción.', error: err.message });
    }
});

/**
 * @swagger
 * /accounts/{accountId}/transactions:
 *   get:
 *     summary: 'Obtiene el historial de transacciones de una cuenta'
 *     tags:
 *       - 'Transacciones'
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: 'path'
 *         name: 'accountId'
 *         required: true
 *         schema:
 *           type: 'string'
 *         description: 'El ID de la cuenta bancaria'
 *     responses:
 *       '200':
 *         description: 'Historial de transacciones obtenido'
*/
router.get('/:accountId/transactions', verifyToken, async (req, res) => {
    try {
        const { accountId } = req.params;
        const account = await Account.findById(accountId);
        
        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada.' });
        }
        if (account.propietario.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'No tiene permiso para ver las transacciones de esta cuenta.' });
        }

        const transactions = await Transaction.find({ cuentaId: accountId }).sort({ fecha: -1 });
        res.json(transactions);
        
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener las transacciones.', error: err.message });
    }
});

/**
 * @swagger
 * /accounts/{accountId}:
 *   delete:
 *     summary: Elimina una cuenta del usuario autenticado
 *     tags: [Cuentas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: El ID de la cuenta a eliminar
 *     responses:
 *       '200':
 *         description: Cuenta eliminada con éxito
 *       '403':
 *         description: No tiene permiso para eliminar esta cuenta
 *       '404':
 *         description: Cuenta no encontrada
 *       '400':
 *         description: No se puede eliminar una cuenta con saldo positivo
 */
router.delete('/:accountId', verifyToken, async (req, res) => {
    try {
        const { accountId } = req.params;
        const account = await Account.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: 'Cuenta no encontrada.' });
        }
        if (account.propietario.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'No tiene permiso para eliminar esta cuenta.' });
        }
        if (account.saldo !== 0) {
            return res.status(400).json({ message: 'No se puede eliminar una cuenta con saldo positivo.' });
        }

        // Eliminar las transacciones asociadas a la cuenta
        await Transaction.deleteMany({ cuentaId: accountId });
        // Eliminar la cuenta
        await Account.findByIdAndDelete(accountId);

        res.status(200).json({ message: 'Cuenta eliminada con éxito.' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar la cuenta.', error: err.message });
    }
});

module.exports = router;