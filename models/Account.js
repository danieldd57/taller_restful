const mongoose = require('mongoose');
const AccountSchema = new mongoose.Schema({
  tipo: { type: String, enum: ['Ahorros', 'Corriente'], required: true },
  saldo: { type: Number, required: true, default: 0 },
  propietario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});
module.exports = mongoose.model('Account', AccountSchema);

