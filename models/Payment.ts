import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPayment extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  plan: string;
  paymentMethod: "Bank Transfer" | "Card" | "Cash" | "Other";
  status: "pending" | "paid" | "failed" | "refunded";
  paymentDate?: Date;
  subscriptionMonths: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema<IPayment> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    plan: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "Card", "Cash", "Other"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    subscriptionMonths: {
      type: Number,
      default: 1,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
