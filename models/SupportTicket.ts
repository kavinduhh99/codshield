import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupportTicket extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  userEmail: string;
  subject: string;
  message: string;
  category: "bug" | "payment" | "feature_request" | "general";
  priority: "low" | "medium" | "high";
  status: "open" | "in_progress" | "resolved" | "closed";
  adminReply?: string;
  screenshotUrl?: string;
  pageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema: Schema<ISupportTicket> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    businessName: { type: String, required: true },
    userEmail: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ["bug", "payment", "feature_request", "general"],
      default: "general",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
      index: true,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    adminReply: { type: String },
    screenshotUrl: { type: String },
    pageUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

const SupportTicket: Model<ISupportTicket> = 
  mongoose.models.SupportTicket || mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export default SupportTicket;
