import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReceivable extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  sourceType: "Courier COD" | "Bank Deposit" | "Card Payment" | "Koko Installment" | "Other";
  sourceName: string;
  amount: number;
  expectedDate: Date;
  status: "pending" | "received" | "overdue" | "cancelled";
  relatedOrderId?: string;
  notes?: string;
  receivedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReceivableSchema: Schema<IReceivable> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: ["Courier COD", "Bank Deposit", "Card Payment", "Koko Installment", "Other"],
      required: true,
    },
    sourceName: { type: String, default: "" },
    amount: { type: Number, required: true, min: 0 },
    expectedDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "received", "overdue", "cancelled"],
      default: "pending",
    },
    relatedOrderId: { type: String, default: "" },
    notes: { type: String, default: "" },
    receivedDate: { type: Date },
  },
  { timestamps: true }
);

const Receivable: Model<IReceivable> =
  mongoose.models.Receivable ||
  mongoose.model<IReceivable>("Receivable", ReceivableSchema);

export default Receivable;
