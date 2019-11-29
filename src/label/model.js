import mongoose from "mongoose";
import labelSchema from "./schema";
import { LABEL_COLLECTION } from "collections";
export const Label = mongoose.model(LABEL_COLLECTION, labelSchema);
