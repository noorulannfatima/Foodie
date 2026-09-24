import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Foodie staff account. There is no public signup: create admins with
 * `npm run create:admin -- <email> <password> <name>`.
 */
export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const adminSchema = new mongoose.Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
  },
  { timestamps: true }
);

adminSchema.pre("save", async function (this: IAdmin) {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

adminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model<IAdmin>("Admin", adminSchema);

export default Admin;
