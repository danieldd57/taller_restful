import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  propietario: mongoose.Types.ObjectId;
  nombre: string;
  saldo: number;
  fechaCreacion: Date;
}

const AccountSchema = new Schema<IAccount>({
  propietario: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  nombre: { type: String, required: true },
  saldo: { type: Number, required: true, default: 0 },
  fechaCreacion: { type: Date, default: Date.now },
});

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
