import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdminSettings extends Document {
  trialDays: number;
  currency: string;
  riskWarningThreshold: number;
  highRiskThreshold: number;
  allowPublicRegistration: boolean;
  announcementText: string;
  paymentInstructions: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
    paymentPhone: string;
    paymentNote: string;
  };
  updatedAt: Date;
}

const AdminSettingsSchema: Schema<IAdminSettings> = new Schema(
  {
    trialDays: { type: Number, default: 30 },
    currency: { type: String, default: "LKR" },
    riskWarningThreshold: { type: Number, default: 2 },
    highRiskThreshold: { type: Number, default: 5 },
    allowPublicRegistration: { type: Boolean, default: true },
    announcementText: { type: String, default: "" },
    paymentInstructions: {
      bankName: { type: String, default: "Dialog Finance PLC" },
      accountName: { type: String, default: "BizFlow" },
      accountNumber: { type: String, default: "0010 2077 3471" },
      branch: { type: String, default: "Head Office" },
      paymentPhone: { type: String, default: "" },
      paymentNote: { type: String, default: "Verification takes up to 24 hours." },
    },
  },
  { timestamps: true }
);

const AdminSettings: Model<IAdminSettings> = mongoose.models.AdminSettings || mongoose.model<IAdminSettings>("AdminSettings", AdminSettingsSchema);

export default AdminSettings;
