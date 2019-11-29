// Invitation Controller
import { Invite } from "./model";

invitationController.post("/", authenticationMiddleware, (req, res) => {
  Invite.findOne({ email: req.body.email }).then(user => {
    if (!user) {
      const invite = new Invite(req.body);
      return invite.save();
    }

    // User exists
    // Add user to project;
  });
});
