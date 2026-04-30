import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIntelligence extends Document {
  phone: string;
  totalOrders: number;
  failedOrders: number;
  successOrders: number;
  isBlacklisted: boolean;
  lastOrderDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IntelligenceSchema = new Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    failedOrders: {
      type: Number,
      default: 0,
    },
    successOrders: {
      type: Number,
      default: 0,
    },
    isBlacklisted: {
      type: Boolean,
      default: false,
    },
    lastOrderDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Intelligence: Model<IIntelligence> =
  mongoose.models.Intelligence || mongoose.model<IIntelligence>("Intelligence", IntelligenceSchema);

export default Intelligence;
