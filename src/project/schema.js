import { Schema } from "mongoose";
import { USER_COLLECTION, BOARD_COLLECTION } from "collections.js";
export const ADMIN = "ADMIN";
export const MANAGER = "MANAGER";
export const USER = "USER";

const messageSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: USER_COLLECTION,
    required: true
  }
});

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

const projectSchema = new Schema({
  boards: [
    {
      type: Schema.Types.ObjectId,
      ref: BOARD_COLLECTION
    }
  ],
  messages: [messageSchema],
  users: [userSchema],
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date
  }
});

const handleMessageAuth = (req, user, messages) => {
  switch (req.method) {
    case "GET": {
      // if (req.params.messageId) {
      //   const message = messages.find(message => {
      //     return message._id.toString() === req.params.messageId;
      //   });
      //   if (
      //     user.user.toString() !== message.user.toString() &&
      //     user.role !== ADMIN
      //   ) {
      //     throw new Error();
      //   }
      //   return;
      // }
      //
      // const userMessage = messages.find(message => {
      //   return message.user.toString() === req.user.id;
      // });
      //
      // if (!userMessage) {
      //   throw new Error();
      // }
      return;
    }
    case "POST": {
      return;
    }
    case "PATCH": {
      const message = messages.find(message => {
        return message._id.toString() === req.params.messageId;
      });
      if (!message) {
        return;
      }
      if (
        user.user.toString() !== message.user.toString() &&
        user.role !== ADMIN
      ) {
        throw new Error();
      }
      return;
    }
    default: {
      throw new Error();
    }
  }
};

const handleProjectAuth = (req, user, project) => {
  switch (req.method) {
    case "POST":
    case "GET": {
      return;
    }
    case "PATCH":
    case "PUT": {
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

projectSchema.statics.authorize = function(req) {
  const projectId = req.params.id;

  console.log("projectId", projectId);
  return this.findById(projectId)
    .populate(["users", "messages"])
    .then(project => {
      if (!project) {
        return;
      }
      const projectUser = project.users.find(user => {
        return user.user.toString() === req.user.id;
      });
      if (!projectUser) {
        throw new Error();
      }

      if (/\/:id\/message/.test(req.route.path)) {
        return handleMessageAuth(req, projectUser, project.messages);
      }

      if (/\/:id/.test(req.route.path)) {
        return handleProjectAuth(req, projectUser, project);
      }
      // TODO: change route, is this how the route is accessed?
      // if (route === "/someadminroute" && projectUser.role !== ADMIN) {
      //   throw new Error();
      // }
      return;
    })
    .catch(e => {});
};

export default projectSchema;
