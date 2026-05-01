import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductCategory extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductCategorySchema: Schema<IProductCategory> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
  },
  {
    timestamps: true,
  }
);

// Ensure name is unique per user
ProductCategorySchema.index({ userId: 1, name: 1 }, { unique: true });

const ProductCategory: Model<IProductCategory> = 
  mongoose.models.ProductCategory || mongoose.model<IProductCategory>("ProductCategory", ProductCategorySchema);

export default ProductCategory;
