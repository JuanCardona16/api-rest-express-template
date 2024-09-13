import mongoose from "mongoose";
import crypto from "node:crypto";
import { validatePassword, passwordHash } from "../../authentication/helpers";
import { setError } from "@/helpers";

const UserMongoSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      unique: true,
      default: () => crypto.randomUUID(),
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

UserMongoSchema.pre("save", function (next) {
  if (!validatePassword(this.password)) {
    return next(setError(400, "Invalid password"));
  }
  this.password = passwordHash(this.password, 12);
  next();
});

export default UserMongoSchema;
