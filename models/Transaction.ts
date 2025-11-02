import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  tipo: 'Depósito' | 'Retiro';
  monto: number;
  descripcion?: string;
  fecha: Date;
  cuentaId: mongoose.Types.ObjectId;
}

const TransactionSchema = new Schema<ITransaction>({
  tipo: { type: String, enum: ['Depósito', 'Retiro'], required: true },
  monto: { type: Number, required: true },
  descripcion: { type: String },
  fecha: { type: Date, default: Date.now },
  cuentaId: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
