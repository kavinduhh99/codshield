import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICodRiskSeed extends Document {
  phone: string;
  customerName?: string;
  address?: string;
  deliveredCount: number;
  returnedCount: number;
  source: string;
  notes?: string;
  createdByAdminId: mongoose.Types.ObjectId;
  assignedBusinessId?: mongoose.Types.ObjectId;
  isGlobal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CodRiskSeedSchema: Schema<ICodRiskSeed> = new Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    customerName: { type: String },
    address: { type: String },
    deliveredCount: { type: Number, default: 0 },
    returnedCount: { type: Number, default: 0 },
    source: { 
      type: String, 
      required: true,
      default: "Admin Import" 
    },
    notes: { type: String },
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedBusinessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    isGlobal: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for quick lookups by phone and visibility
CodRiskSeedSchema.index({ phone: 1, isGlobal: 1 });
CodRiskSeedSchema.index({ phone: 1, assignedBusinessId: 1 });

const CodRiskSeed: Model<ICodRiskSeed> = 
  mongoose.models.CodRiskSeed || mongoose.model<ICodRiskSeed>("CodRiskSeed", CodRiskSeedSchema);

export default CodRiskSeed;
