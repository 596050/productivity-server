import { parseUrl } from "query-string";
import { Project } from "./model";
import { authenticationMiddleware } from "auth";
import { Controller } from "common/controller";
import { ADMIN } from "./schema";
const projectController = new Controller("/projects");
const INTERNAL_SERVER_ERROR = "Internal Server Error";

projectController.post("/", (req, res) => {
  const newProject = new Project(req.body);
  newProject.users = [{ user: req.body.user.id, role: ADMIN }];
  return newProject.save().then(newProject => {
    newProject.createdAt = Date.now();
    return res.json(newProject);
  });
});

projectController.get("/:id", authenticationMiddleware, (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project) {
        return res.status(404).json("Project not found.");
      }
      return res.status(200).json(project);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

projectController.get("/", authenticationMiddleware, (req, res) => {
  Project.find()
    .then(projects => {
      if (!projects) {
        return res.status(404).json("Projects not found.");
      }
      return res.status(200).json(projects);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

projectController.put("/:id", authenticationMiddleware, (req, res) => {
  const put = new Project(req.body);
  put
    .validate()
    .then(() => {
      return Project.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true
      })
        .then(project => {
          return res.json(project);
        })
        .catch(err => {
          console.log(err.message);
          return res.status(500).json(INTERNAL_SERVER_ERROR);
        });
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

projectController.patch("/:id", authenticationMiddleware, (req, res) => {
  Project.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body },
    {
      new: true
    }
  )
    .then(project => {
      return res.status(200).json(project);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

// Need to delete other component parts
// What about messages?
projectController.delete("/:id", authenticationMiddleware, (req, res) => {
  Project.findById(req.params.id)
    .populate(["boards", "boards.cards"])
    .then(project => {
      let result = Promise.resolve();
      project.boards.forEach(board => {
        board.cards.forEach(card => {
          result = result.then(card.delete);
        });
        result = result.then(board.delete);
      });
      result
        .then(project.delete)
        .then(() => {
          return res.status(200).json("Project deleted.");
        })
        .catch(err => {
          console.log(err.message);
          return res.status(500).json(INTERNAL_SERVER_ERROR);
        });
    });
});

projectController.post("/:id/message", authenticationMiddleware, (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project.messages) {
        project.messages = [];
      }
      const message = { ...req.body, user: req.user.id };
      project.messages.push(message);
      return project.save().then(project => {
        return res.json(message);
      });
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

// For email updates
projectController.get(
  "/:id/message/:messageId",
  authenticationMiddleware,
  (req, res) => {
    Project.findById(req.params.id)
      .then(project => {
        if (!project) {
          return res.status(404).json("Project not found.");
        }
        const message = project.messages.find(message => {
          return message._id.toString() === req.params.messageId;
        });
        if (!message) {
          return res.status(404).json("Message not found.");
        }
        return res.status(200).json(message);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

projectController.patch(
  "/:id/message/:messageId",
  authenticationMiddleware,
  (req, res) => {
    Project.findOne({ _id: req.params.id })
      .populate("messages")
      .then(project => {
        if (!project) {
          return res.status(404).json("Project not found.");
        }
        const index = project.messages.findIndex(message => {
          return message._id.toString() === req.params.messageId;
        });
        if (index <= -1) {
          return res.status(404).json("Message not found.");
        }
        const message = { ...project.messages[index].toObject(), ...req.body };
        project.messages[index] = message;
        return project.save().then(project => {
          return res.status(200).json(message);
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

// TODO: Implement deletion of messages on projects
projectController.delete(
  "/:id/message/:messageId",
  authenticationMiddleware,
  (req, res) => {}
);

projectController.get("/:id/message", authenticationMiddleware, (req, res) => {
  Project.findById(req.params.id)
    .then(project => {
      if (!project) {
        return res.status(404).json("Project not found.");
      }
      const query = parseUrl(req.url).query;
      const messages = project.messages.filter(message => {
        for (const q in query) {
          if (!message[q] || message[q].toString() !== query[q].toString()) {
            return false;
          }
        }
        return true;
      });
      return res.status(200).json(messages);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

projectController.get(
  "/:id/message/:userId",
  authenticationMiddleware,
  (req, res) => {
    Project.findById(req.params.id)
      .populate(["messages"])
      .then(project => {
        if (!project) {
          return res.status(404).json("Project not found.");
        }
        return res.status(200).json(
          project.messages.filter(message => {
            return message.user.toString() === req.params.userId;
          })
        );
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

export default projectController;
