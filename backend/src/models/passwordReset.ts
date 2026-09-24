import mongoose, { Document } from "mongoose";

/**
 * Stores a short-lived password reset code for a given account.
 *
 * The code itself is never stored in plain text — only a bcrypt hash of it.
 * Documents auto-expire via a TTL index on `expiresAt`, so stale codes are
 * cleaned up by MongoDB without any extra cron job.
 */
export interface IPasswordReset extends Document {
  email: string;
  role: "customer" | "restaurant" | "delivery";
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const passwordResetSchema = new mongoose.Schema<IPasswordReset>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["customer", "restaurant", "delivery"],
    },
    codeHash: {
      type: String,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Look up active reset requests by account quickly.
passwordResetSchema.index({ email: 1, role: 1 });

// TTL index: MongoDB removes the document once `expiresAt` is in the past.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model<IPasswordReset>(
  "PasswordReset",
  passwordResetSchema
);

export default PasswordReset;
