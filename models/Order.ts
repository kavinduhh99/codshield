import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  customerName: string;
  phone: string;
  phone2?: string;
  address: string;
  city: string;
  status: "pending" | "delivered" | "returned";
  riskScore: number;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema<IOrder> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    phone2: {
      type: String,
      required: false,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "delivered", "returned"],
      default: "pending",
    },
    riskScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> = mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
