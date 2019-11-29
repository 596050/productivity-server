const inviteSchema = new Schema({
  email: {
    type: String
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: USER_COLLECTION
  },
  invitedTo: [
    {
      type: Schema.Types.ObjectId,
      ref: PROJECT_COLLECTION
    }
  ],
  invitationToken: {
    type: String,
    default: () => {
      return uuid();
    }
  }
});
