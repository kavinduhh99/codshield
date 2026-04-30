import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  businessName: string;
  phone?: string;
  role: "admin" | "business";
  subscription: {
    plan: "Free Trial" | "Pro";
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
  status: "active" | "suspended";
  paymentStatus: "paid" | "pending_verification" | "none";
  isVerified: boolean;
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
        enum: ["Free Trial", "Pro"],
        default: "Free Trial",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending_verification", "none"],
      default: "none",
    },
    isVerified: {
      type: Boolean,
      default: false,
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

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
  } catch (error: any) {
    throw error;
  }
});

// Prevent mongoose from recompiling the model upon hot-reloading
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
