import inviteSchema from "./schema";
import { USER_COLLECTION } from "user";

export const Invite = mongoose.model(USER_COLLECTION, inviteSchema);
