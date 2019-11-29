import mongoose from "mongoose";
import UserSchema from "./schema";

export const USER_COLLECTION = "users";
export const User = mongoose.model(USER_COLLECTION, UserSchema);
