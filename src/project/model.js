import mongoose from "mongoose";
import ProjectSchema from "./schema";
import { PROJECT_COLLECTION } from "collections";
export const Project = mongoose.model(PROJECT_COLLECTION, ProjectSchema);
