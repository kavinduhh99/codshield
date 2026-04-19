import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISearchLog extends Document {
  phone: string;
  sellerId: string;
  timestamp: Date;
}

const SearchLogSchema = new Schema<ISearchLog>({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  sellerId: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

const SearchLog: Model<ISearchLog> =
  mongoose.models.SearchLog ||
  mongoose.model<ISearchLog>("SearchLog", SearchLogSchema);

export default SearchLog;
