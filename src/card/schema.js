import { Schema } from "mongoose";
import {
  USER_COLLECTION,
  LABEL_COLLECTION,
  BOARD_COLLECTION
} from "collections";
import { ADMIN, MANAGER, USER } from "board";

const COMMENT = "COMMENT";
const LABEL = "LABEL";
const COLUMN = "COLUMN";
const CHECKLIST = "CHECKLIST";
const DUEDATE = "DUEDATE";

const CREATED = "CREATED";

const activitySchema = new Schema({
  activity: {
    type: String,
    enum: [COMMENT, LABEL, COLUMN, CHECKLIST, DUEDATE, CREATED],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdDate: {
    type: Date
  },
  modifiedDate: {
    type: Date
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: USER_COLLECTION,
    required: true
  }
});

const checklistItemSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  complete: {
    type: Boolean,
    default: false
  }
});

const checklistSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  items: [checklistItemSchema]
});

const cardSchema = new Schema({
  text: {
    type: String
  },
  archived: {
    type: Boolean
  },
  watchers: [
    {
      type: Schema.Types.ObjectId,
      ref: USER_COLLECTION
    }
  ],
  members: [
    {
      type: Schema.Types.ObjectId,
      ref: USER_COLLECTION
    }
  ],
  checklists: [checklistSchema],
  labels: [
    {
      type: Schema.Types.ObjectId,
      ref: LABEL_COLLECTION
    }
  ],
  dueDate: {
    type: Date
  },
  activity: [
    {
      type: activitySchema,
      default: [{ activity: CREATED, text: "Card created" }]
    }
  ],
  board: {
    type: Schema.Types.ObjectId,
    ref: BOARD_COLLECTION,
    required: true
  }
});

cardSchema.methods.addLabel = function(label, user) {
  const card = this;
  card.labels.push(label);
  card.activity.push({
    activity: LABEL,
    user: user.id,
    text: `${user.username} added the ${label.text} label`
  });
};

cardSchema.methods.removeLabel = function(labelId, user) {
  const card = this;
  card.populate("labels");
  const index = card.labels.findIndex(label => {
    return label._id.toString() === labelId;
  });
  const label = card.labels[index];
  card.labels.splice(index, 1);
  card.activity.push({
    activity: LABEL,
    user: user.id,
    text: `${user.username} deleted the ${label.text} label`
  });
};

cardSchema.methods.addChecklist = function(checklist, user) {
  const card = this;
  if (!card.checklists) {
    card.checklists = [];
  }
  card.checklists.push(checklist);
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} added the ${checklist.name} checklist`
  });
};

cardSchema.methods.editChecklist = function(checklistId, name, user) {
  const card = this;
  const index = card.checklists.findIndex(checklist => {
    return checklist._id.toString() === checklistId;
  });
  card.checklists.splice(index, 1, {
    ...card.checklists[index],
    name
  });
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} updated the ${name} checklist`
  });
};

cardSchema.methods.removeChecklist = function(checklistId, user) {
  const card = this;
  const index = card.checklists.findIndex(checklist => {
    return checklist._id.toString() === checklistId;
  });
  const checklist = card.checklists[index];
  card.checklists.splice(index, 1);
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} deleted the ${checklist.name} checklist`
  });
};

cardSchema.methods.addChecklistItem = function(
  checklistId,
  checklistItem,
  user
) {
  const card = this;
  const checklist = card.checklists.find(checklist => {
    checklist._id.toString() === checklistId;
  });
  checklist.items.push(checklistItem);
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} added ${checklistItem.text} to the ${checklist.name} checklist.`
  });
};

cardSchema.methods.editChecklistItem = function(
  checklistId,
  checklistItemId,
  checklistItem,
  user
) {
  const card = this;
  const checklistIndex = card.checklists.findIndex(checklist => {
    return checklist._id.toString() === checklistId;
  });
  const checklist = card.checklists[checklistIndex];
  const checklistItemIndex = checklist.items.findIndex(item => {
    return item._id.toString() === checklistItemId;
  });
  checklist.items.splice(checklistItemIndex, 1, {
    ...checklist[checklistItemIndex],
    ...checklistItem
  });
  card.checklists.splice(checklistIndex, 1, checklist);
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} edited ${checklistItem.text} in the ${checklist.name} checklist.`
  });
};

cardSchema.methods.removeChecklistItem = function(
  checklistId,
  checklistItemId,
  user
) {
  const card = this;
  const index = card.checklists.findIndex(checklist => {
    return checklist._id.toString() === checklistId;
  });
  const checklist = card.checklists[index];
  const checklistItemIndex = checklist.items.findIndex(item => {
    return checklistItemId === item._id.toString();
  });
  const checklistItem = checklist.items[checklistItemIndex];
  checklist.splice(checklistItemIndex, 1);
  card.checklists.splice(index, 1, checklist);
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} deleted ${checklistItem.text} from the ${checklist.name} checklist`
  });
};

cardSchema.methods.markChecklistItemComplete = function(
  checklistId,
  checklistItemId,
  user
) {
  const card = this;
  const index = card.checklists.findIndex(checklist => {
    return checklist._id.toString() === checklistId;
  });
  const checklist = card.checklists[index];
  const checklistItemIndex = checklist.items.findIndex(item => {
    return checklistItemId === item._id.toString();
  });
  const checklistItem = checklist.items[checklistItemIndex];
  if (checklistItem.complete) {
    return;
  }
  // True is mark as complete
  checklistItem.complete = true;
  checklist.splice(checklistItemIndex, 1, checklistItem);
  card.checklists.splice(index, 1, checklist);
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} marked ${checklistItem.text} as complete in the ${checklist.name} checklist`
  });
};

cardSchema.methods.markChecklistItemIncomplete = function(
  checklistId,
  checklistItemId,
  user
) {
  const card = this;
  const index = card.checklists.findIndex(checklist => {
    return checklist._id.toString() === checklistId;
  });
  const checklist = card.checklists[index];
  const checklistItemIndex = checklist.items.findIndex(item => {
    return checklistItemId === item._id.toString();
  });
  const checklistItem = checklist.items[checklistItemIndex];
  if (!checklistItem.complete) {
    return;
  }
  // False is mark as complete
  checklistItem.complete = false;
  checklist.splice(checklistItemIndex, 1, checklistItem);
  card.checklists.splice(index, 1, checklist);
  card.activity.push({
    activity: CHECKLIST,
    user: user.id,
    text: `${user.username} marked ${checklistItem.text} as incomplete in the ${checklist.name} checklist`
  });
};

cardSchema.methods.addComment = function(comment, user) {
  const card = this;
  card.activity.push({
    activity: COMMENT,
    user: user.id,
    text: comment.text
  });
};

cardSchema.methods.removeComment = function(activityId, user) {
  const card = this;
  const index = card.activity.findIndex(act => {
    return act._id.toString() === activityId;
  });
  const removedComment = card.activity[index];
  card.activity.splice(index, 1);
  card.activity.push({
    activity: COMMENT,
    user: user.id,
    text: `${user.username} removed their comment.`
  });
};

cardSchema.methods.editComment = function(activityId, commentText, user) {
  const card = this;
  const index = card.activity.findIndex(act => {
    return act._id.toString() === activityId && act.activity === COMMENT;
  });
  const editedComment = card.activity[index];
  card.activity.splice(index, 1, {
    activity: COMMENT,
    user: user.id,
    text: commentText
  });
};

const handleCommentAuth = (req, user, comments) => {
  switch (req.method) {
    case "POST":
    case "GET": {
      return;
    }
    case "PUT":
    case "PATCH": {
      const comment = comments.find(
        comment => comment._id.toString() === req.params.commentId
      );
      if (!comment) {
        return;
      }
      if (
        user.role !== ADMIN &&
        user.role !== MANAGER &&
        user.user.toString() !== comment.user.toString()
      ) {
        throw new Error();
      }
      return;
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

const handleLabelAuth = (req, user, labels) => {
  switch (req.method) {
    case "GET": {
      return;
    }
    case "POST":
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

const handleChecklistAuth = (req, user, checklists) => {
  switch (req.method) {
    case "POST":
    case "PUT":
    case "PATCH":
    case "GET": {
      return;
    }
    case "DELETE": {
      if (user.role !== ADMIN && user.role !== MANAGER) {
        throw new Error();
      }
    }
    default: {
      throw new Error();
    }
  }
};

const handleCardAuth = (req, user, card) => {
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

cardSchema.statics.authorize = function(req) {
  return this.findById(req.params.id)
    .populate("board")
    .then(card => {
      const user = card.board.users.find(
        user => user.user.toString() === req.user.id
      );

      if (!user) {
        throw new Error();
      }

      if (/\/:id\/comment/.test(req.route.path)) {
        return handleCommentAuth(
          req,
          user,
          card.activity.filter(activity => activity.activity === COMMENT)
        );
      }

      if (/\/:id\/label/.test(req.route.path)) {
        return handleLabelAuth(req, user, card.label);
      }

      if (/\/:id\/checklist/.test(req.route.path)) {
        return handleChecklistAuth(req, user, card.checklist);
      }

      if (/\/:id/.test(req.route.path)) {
        return handleCardAuth(req, user, card);
      }
      return;
    });
};

export default cardSchema;
