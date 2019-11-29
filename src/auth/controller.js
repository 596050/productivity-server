import { Controller } from "common/controller";
import { User } from "user";

const authController = new Controller("/authenticate");
// Login
authController.post("/", (req, res) => {
  const { identifier, password } = req.body;
  //
  User.findOne({ $or: [{ username: identifier }, { email: identifier }] })
    .then(user => {
      if (!user) {
        return res
          .status(401)
          .json({ identifier: " ", password: "Invalid Credentials." });
      }
      user
        .comparePassword(password)
        .then(isValid => {
          if (!isValid) {
            return res
              .status(401)
              .json({ identifier: " ", password: "Invalid Credentials." });
          }
          return user.generateJwtToken();
        })
        .then(token => {
          return res.json(token);
        });
    })
    .catch(err => res.status(500).json(err.message));
});

export default authController;
