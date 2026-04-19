import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  businessName: string;
  phone?: string;
  role: "admin" | "business";
  subscription: {
    plan: "free" | "pro";
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
  paymentStatus: "none" | "pending_verification";
  isEmailVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      select: false,
    },
    businessName: {
      type: String,
      required: [true, "Please provide a business name"],
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "business"],
      default: "business",
      lowercase: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
      },
      isActive: {
        type: Boolean,
        default: false,
      },
    },
    paymentStatus: {
      type: String,
      enum: ["none", "pending_verification"],
      default: "none",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose from recompiling the model upon hot-reloading
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
