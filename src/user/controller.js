import { User } from "./model";
import { Project } from "project";
import { Board } from "board";
import { Card } from "card";
import { createAuthorizationMiddleware } from "auth";
import Controller from "common/controller";

const userController = new Controller("/users");
const INTERNAL_SERVER_ERROR = "Internal Server Error";

// If registration is not enabled then only be able to create users if an administrator
const dynamicMiddleware = (req, res, next) => {
  if (process.env.REGISTRATION_ENABLED || req.headers.Authorization) {
    return createAuthorizationMiddleware(User)(req, res, next);
  }
  return next();
};

// CRUD
// Create a User
userController.post("/", dynamicMiddleware, (req, res) => {
  User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }]
  })
    .then(user => {
      if (!user) {
        const newUser = new User(req.body);
        return newUser.save().then(nu => {
          return res.json(nu);
        });
      }
      const errors = {};
      if (user.username === req.body.username) {
        errors.username = "Username already in use.";
      }
      if (user.email === req.body.email) {
        errors.email = "Email already in use.";
      }
      return res.status(409).json(errors);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

// Get individual user
userController.get("/me", createAuthorizationMiddleware(User), (req, res) => {
  User.findById(req.user.id)
    .then(user => {
      if (!user) {
        return res.status(404).json("User not found.");
      }
      return res.status(200).json(user);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

// Get individual user
userController.get("/:id", createAuthorizationMiddleware(User), (req, res) => {
  User.findById(req.params.id)
    .then(user => {
      if (!user) {
        return res.status(404).json("User not found.");
      }
      return res.status(200).json(user);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

userController.get("/", createAuthorizationMiddleware(User), (req, res) => {
  User.find()
    .then(users => {
      if (!users) {
        return res.status(404).json("Users not found.");
      }
      return res.status(200).json(users);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

// Full update of all fields
userController.put("/:id", createAuthorizationMiddleware(User), (req, res) => {
  const put = new User(req.body);
  // Validate is all the properties it requires to update the whole object
  put
    .validate()
    .then(() => {
      return User.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true
      })
        .select(["-admin"])
        .then(user => {
          return res.json(user);
        })
        .catch(err => {
          console.log(err);
          console.log(err.message);
          return res.status(500).json(INTERNAL_SERVER_ERROR);
        });
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

userController.patch(
  "/:id",
  createAuthorizationMiddleware(User),
  (req, res) => {
    User.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    )
      .select(["-admin"])
      .then(user => {
        return res.json(user);
      })
      .catch(err => {
        console.log(err);
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

userController.delete(
  "/:id",
  createAuthorizationMiddleware(User),
  (req, res) => {
    User.remove({ _id: req.params.id })
      .then(() => {
        return res.status(200).json("User deleted.");
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

userController.get(
  "/:id/projects",
  createAuthorizationMiddleware(User),
  (req, res) => {
    Project.find({ "users.user": req.params.id })
      .then(projects => {
        if (!projects) {
          return res.status(404).json("No projects found.");
        }
        return res.status(200).json(projects);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

userController.get(
  "/:id/boards",
  createAuthorizationMiddleware(User),
  (req, res) => {
    Board.find({ "users.user": req.params.id })
      .then(boards => {
        if (!boards) {
          return res.status(404).json("No boards found.");
        }
        return res.status(200).json(boards);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

userController.get(
  "/:id/cards",
  createAuthorizationMiddleware(User),
  (req, res) => {
    Card.find({
      $or: {
        watchers: req.params.id,
        members: req.params.id
      }
    })
      .then(cards => {
        if (!cards) {
          return res.status(404).json("No cards found.");
        }
        return res.status(200).json(cards);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

export default userController;
