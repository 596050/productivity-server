import mongoose from "mongoose";
import CardSchema from "./schema";
import { CARD_COLLECTION } from "collections";
export const Card = mongoose.model(CARD_COLLECTION, CardSchema);
