const mongoose = require('mongoose');
const TransactionSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['Depósito', 'Retiro'], required: true },
  monto: { type: Number, required: true, min: 0 },
  fecha: { type: Date, default: Date.now },
  descripcion: { type: String },
  cuentaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
});
module.exports = mongoose.model('Transaction', TransactionSchema);