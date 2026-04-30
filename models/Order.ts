import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  customerName: string;
  phone: string;
  phone2?: string;
  address: string;
  city?: string;
  district?: string;
  // New Fields
  items?: {
    productId?: mongoose.Types.ObjectId;
    productName: string;
    sku?: string;
    quantity: number;
    costPrice: number;
    unitSellingPrice: number;
    lineTotal: number;
  }[];
  itemsSubtotal?: number;
  discount?: number;
  totalAmount?: number;
  paymentMethod?: "COD" | "Card Payment" | "Bank Deposit" | "Koko Installment" | "Other";
  paymentStatus?: "unpaid" | "paid" | "partial" | "refunded";

  // Legacy Fields with fallbacks (kept for backward compatibility)
  productId?: mongoose.Types.ObjectId;
  productNameText?: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  deliveryFee: number;
  codAmount: number;
  courierName: string;
  trackingNumber: string;
  externalOrderId?: string;
  notes: string;

  status: "pending" | "processing" | "shipped" | "delivered" | "returned" | "cancelled";
  returnReason?: "Customer Refused" | "Courier Issue" | "Other";
  riskScore: number;
  orderDate?: Date;
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
      required: false,
    },
    district: {
      type: String,
      required: false,
    },
    // New Multi-item structure
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: false,
        },
        productName: { type: String, required: true },
        sku: { type: String, required: false },
        quantity: { type: Number, required: true, default: 1 },
        costPrice: { type: Number, required: true, default: 0 },
        unitSellingPrice: { type: Number, required: true, default: 0 },
        lineTotal: { type: Number, required: true, default: 0 },
      }
    ],
    itemsSubtotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["COD", "Card Payment", "Bank Deposit", "Koko Installment", "Other"],
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "partial", "refunded"],
      default: "unpaid",
    },

    // Legacy fields (kept for backward compatibility)
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
    },
    productNameText: { type: String, required: false },
    quantity: { type: Number, default: 1 },
    costPrice: { type: Number, default: 0 },
    sellingPrice: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    codAmount: { type: Number, default: 0 },
    courierName: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    externalOrderId: { type: String, required: false },
    notes: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "returned", "cancelled"],
      default: "pending",
    },
    returnReason: {
      type: String,
      enum: ["Customer Refused", "Courier Issue", "Other"],
      required: false,
    },
    riskScore: {
      type: Number,
      default: 0,
    },
    orderDate: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Clear mongoose models cache during development HMR
if (mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
