import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBusinessProfile {
  businessName: string;
  ownerName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  logoUrl: string;
}

export interface IInvoiceSettings {
  invoicePrefix: string;
  invoiceStartNumber: number;
  invoiceNotes: string;
  showLogoOnInvoice: boolean;
  currency: string;
}

export interface IWaybillSettings {
  defaultCourier: string;
  senderName: string;
  senderPhone: string;
  pickupAddress: string;
  defaultDeliveryNotes: string;
}

export interface IOrderSettings {
  defaultDeliveryFee: number;
  defaultOrderStatus: string;
  autoReduceStock: boolean;
  restoreStockOnReturn: boolean;
}

export interface IShieldSettings {
  warningRiskThreshold: number;
  highRiskThreshold: number;
  showHighRiskConfirmation: boolean;
}

export interface ISettings extends Document {
  userId: mongoose.Types.ObjectId;
  businessProfile: IBusinessProfile;
  invoiceSettings: IInvoiceSettings;
  waybillSettings: IWaybillSettings;
  orderSettings: IOrderSettings;
  shieldSettings: IShieldSettings;
  createdAt: Date;
  updatedAt: Date;
}

export const defaultSettings = {
  businessProfile: {
    businessName: "",
    ownerName: "",
    businessPhone: "",
    businessEmail: "",
    businessAddress: "",
    logoUrl: "",
  },
  invoiceSettings: {
    invoicePrefix: "INV",
    invoiceStartNumber: 1001,
    invoiceNotes: "Thank you for your business!",
    showLogoOnInvoice: false,
    currency: "LKR",
  },
  waybillSettings: {
    defaultCourier: "",
    senderName: "",
    senderPhone: "",
    pickupAddress: "",
    defaultDeliveryNotes: "",
  },
  orderSettings: {
    defaultDeliveryFee: 0,
    defaultOrderStatus: "pending",
    autoReduceStock: true,
    restoreStockOnReturn: true,
  },
  shieldSettings: {
    warningRiskThreshold: 30,
    highRiskThreshold: 70,
    showHighRiskConfirmation: true,
  },
};

const SettingsSchema: Schema<ISettings> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    businessProfile: {
      businessName: { type: String, default: "" },
      ownerName: { type: String, default: "" },
      businessPhone: { type: String, default: "" },
      businessEmail: { type: String, default: "" },
      businessAddress: { type: String, default: "" },
      logoUrl: { type: String, default: "" },
    },
    invoiceSettings: {
      invoicePrefix: { type: String, default: "INV" },
      invoiceStartNumber: { type: Number, default: 1001 },
      invoiceNotes: { type: String, default: "Thank you for your business!" },
      showLogoOnInvoice: { type: Boolean, default: false },
      currency: { type: String, default: "LKR" },
    },
    waybillSettings: {
      defaultCourier: { type: String, default: "" },
      senderName: { type: String, default: "" },
      senderPhone: { type: String, default: "" },
      pickupAddress: { type: String, default: "" },
      defaultDeliveryNotes: { type: String, default: "" },
    },
    orderSettings: {
      defaultDeliveryFee: { type: Number, default: 0 },
      defaultOrderStatus: { type: String, default: "pending" },
      autoReduceStock: { type: Boolean, default: true },
      restoreStockOnReturn: { type: Boolean, default: true },
    },
    shieldSettings: {
      warningRiskThreshold: { type: Number, default: 30 },
      highRiskThreshold: { type: Number, default: 70 },
      showHighRiskConfirmation: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);

export default Settings;
