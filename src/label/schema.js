import { Schema } from "mongoose";

const labelSchema = new Schema({
  text: {
    type: String
  },
  color: {
    type: String
  }
});

export default labelSchema;
