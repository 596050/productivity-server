import mongoose from "mongoose";
import BoardSchema from "./schema";
import { BOARD_COLLECTION } from "collections";
export const Board = mongoose.model(BOARD_COLLECTION, BoardSchema);
