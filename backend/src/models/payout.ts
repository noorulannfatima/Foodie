import mongoose, { Document } from "mongoose";
import { IPayoutAccount, payoutAccountSchema } from "./restaurant";

export type PayoutStatus = "Processing" | "Paid" | "Failed";

/**
 * A frozen settlement of a restaurant's delivered orders. Amounts are computed
 * once at generation time (see payoutCalculator) and never recalculated, so a
 * later commission change doesn't rewrite history.
 *
 * netAmount < 0 means the restaurant owes Foodie (commission on cash orders).
 */
export interface IPayout extends Document {
  restaurant: mongoose.Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  orders: mongoose.Types.ObjectId[];

  orderCount: number;
  grossSales: number;
  onlineSales: number;
  cashSales: number;
  commission: number;
  paymentFees: number;
  netAmount: number;
  commissionRate: number;

  status: PayoutStatus;
  reference?: string; // Bank / wallet transaction reference
  paidAt?: Date;
  failureReason?: string;
  accountSnapshot?: IPayoutAccount; // Account the money was sent to

  createdAt: Date;
  updatedAt: Date;
}

const payoutSchema = new mongoose.Schema<IPayout>(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

    orderCount: { type: Number, required: true },
    grossSales: { type: Number, required: true },
    onlineSales: { type: Number, required: true },
    cashSales: { type: Number, required: true },
    commission: { type: Number, required: true },
    paymentFees: { type: Number, required: true },
    netAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },

    status: {
      type: String,
      enum: ["Processing", "Paid", "Failed"],
      default: "Processing",
      index: true,
    },
    reference: { type: String, trim: true },
    paidAt: Date,
    failureReason: { type: String, trim: true },
    accountSnapshot: { type: payoutAccountSchema, default: undefined },
  },
  { timestamps: true }
);

payoutSchema.index({ restaurant: 1, createdAt: -1 });

const Payout = mongoose.model<IPayout>("Payout", payoutSchema);

export default Payout;
