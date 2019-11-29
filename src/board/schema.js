import { Schema } from "mongoose";
import {
  USER_COLLECTION,
  LABEL_COLLECTION,
  CARD_COLLECTION
} from "collections";
export const ADMIN = "ADMIN";
export const MANAGER = "MANAGER";
export const USER = "USER";

const userSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: USER_COLLECTION,
    required: true
  },
  role: {
    type: String,
    enum: [ADMIN, MANAGER, USER]
  }
});

const cardSchema = new Schema({
  card: {
    type: Schema.Types.ObjectId,
    ref: CARD_COLLECTION,
    required: true
  },
  position: {
    type: Number,
    required: true
  }
});

const boardSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  columns: [
    {
      title: {
        type: String,
        required: true
      },
      color: {
        type: String
      },
      cards: [cardSchema],
      position: {
        type: Number,
        required: true
      }
    }
  ],
  users: [userSchema],
  labels: [
    {
      type: Schema.Types.ObjectId,
      ref: LABEL_COLLECTION
    }
  ],
  background: {
    type: String
  }
});

const handleBoardAuth = (req, user, board) => {
  switch (req.method) {
    case "POST":
    case "GET": {
      return;
    }
    case "PUT":
    case "PATCH": {
      if (user.role !== ADMIN && user.role !== MANAGER) {
        throw new Error();
      }
    }
    case "DELETE": {
      if (user.role !== ADMIN) {
        throw new Error();
      }
    }
    default: {
      throw new Error();
    }
  }
};

boardSchema.statics.authorize = function(req) {
  return this.findById(req.params.id)
    .populate(["cards", "users"])
    .then(board => {
      let user;
      if (board) {
        user = board.users.find(user => user.user.toString() === req.user.id);
      }
      console.log("USER", user, board);
      return handleBoardAuth(req, user, board);
    });
};

// boardSchema.pre("delete", function() {
//   this.populate("cards").then();
// });

export default boardSchema;
