import { Card } from "./model";
import { authenticationMiddleware } from "auth";
import { Controller } from "common/controller";
const cardController = new Controller("/cards");
const INTERNAL_SERVER_ERROR = "Internal Server Error";

const COMMENT = "COMMENT";
const LABEL = "LABEL";
const COLUMN = "COLUMN";
const CHECKLIST = "CHECKLIST";
const DUEDATE = "DUEDATE";

cardController.post("/", authenticationMiddleware, (req, res) => {
  const newCard = new Card(req.body);
  return newCard
    .save()
    .then(newCard => {
      return res.json(newCard);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.get("/:id", authenticationMiddleware, (req, res) => {
  Card.findById(req.params.id)
    .populate("labels")
    .then(card => {
      if (!card) {
        return res.status(404).json("Card not found.");
      }
      return res.status(200).json(card);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.get("/", authenticationMiddleware, (req, res) => {
  Card.find()
    .then(cards => {
      if (!cards) {
        return res.status(404).json("Cards not found.");
      }
      return res.status(200).json(cards);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.put("/:id", authenticationMiddleware, (req, res) => {
  const put = new Card(req.body);
  put
    .validate()
    .then(() => {
      return Card.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true
      })
        .then(card => {
          return res.status(200).json(card);
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

cardController.patch("/:id", authenticationMiddleware, (req, res) => {
  Card.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body },
    {
      new: true
    }
  )
    .then(card => {
      return res.status(200).json(card);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.delete("/:id", authenticationMiddleware, (req, res) => {
  Card.remove({ _id: req.params.id })
    .then(() => {
      return res.status(204).json("Card deleted.");
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

// Comments

cardController.post("/:id/comment", authenticationMiddleware, (req, res) => {
  Card.findById(req.params.id)
    .then(card => {
      card.addComment(req.body, req.user);
      card.save().then(card => {
        return res.json(card);
      });
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.get(
  "/:id/comment/:activityId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        const comment = card.activity.find(activity => {
          return (
            activity._id.toString() === req.params.activityId &&
            activity.activity === COMMENT
          );
        });
        if (!comment) {
          return res.status(404).json("Could not find comment.");
        }
        return res.status(200).json(comment);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

// TODO: Could get all comments for a project and/or board?
cardController.get(
  "/:id/comment/:userId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        const userActivities = card.activity.filter(activ => {
          return activ.user._id.toString() === req.user.id;
        });
        return res.status(200).json(userActivities);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.get("/:id/comment", authenticationMiddleware, (req, res) => {
  Card.findById(req.params.id)
    .populate(["activity"])
    .then(card => {
      if (!card) {
        return res.status(404).json("Card not found.");
      }
      return res.status(200).json(card.text);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.patch(
  "/:id/comment/:activityId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        card.editComment(req.params.activityId, req.body.text, req.user);
        card.save().then(card => {
          return res.status(200).json(card.text);
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.delete(
  "/:id/comment/:activityId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        card.removeComment(req.params.activityId, req.user);
        card.save().then(card => {
          return res.status(204).json("Comment deleted.");
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

// Labels

cardController.post("/:id/label", authenticationMiddleware, (req, res) => {
  Card.findById(req.params.id)
    .then(card => {
      card.addLabel(req.body, req.user);
      card.save().then(card => {
        return res.json(card);
      });
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.get(
  "/:id/label/:labelId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .populate(["labels"])
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        return res.status(200).json(card.labels[req.params.labelId]);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.get("/:id/label", authenticationMiddleware, (req, res) => {
  Card.findById(req.params.id)
    .populate("labels")
    .then(card => {
      if (!card) {
        return res.status(404).json("Card not found.");
      }
      return res.status(200).json(card.labels);
    })
    .catch(err => {
      console.log(err.messsage);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.delete(
  "/:id/label/:labelId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        card.removeLabel(req.params.labelId, req.user);
        card.save().then(card => {
          return res.status(200).json(card);
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

// Checklists

cardController.post("/:id/checklist", authenticationMiddleware, (req, res) => {
  Card.findById(req.params.id)
    .then(card => {
      card.addChecklist(req.body, req.user);
      card.save().then(card => {
        return res.json(card);
      });
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.get(
  "/:id/checklist/:checklistId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        const checklist = card.checklists.find(checklist => {
          return checklist._id.toString() === req.params.checklistId;
        });
        return res.status(200).json(checklist);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.get("/:id/checklist", authenticationMiddleware, (req, res) => {
  Card.findById(req.params.id)
    .then(card => {
      if (!card) {
        return res.status(404).json("Card not found.");
      }
      return res.status(200).json(card.checklists);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

cardController.patch(
  "/:id/checklist/:checklistId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        card.editChecklist();
        return res.status(200).json(card);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

// TODO: Are these the correct properties to populate?
cardController.delete(
  "/:id/checklist/:checklistId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .populate(["activity", "checklists", "checklists.items"])
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found");
        }
        card.removeChecklist(req.params.checklistId, req.user);
        card.checklists[checklistId].delete;
        card.save().then(() => {
          return res.status(204).json("Card checklist deleted.");
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.post(
  "/:id/checklist/:checklistId/item",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        card.addChecklistItem(req.params.checklistId, req.body, req.user);
        card.save().then(card => {
          // TODO: Return card checklist or checklist Item?
          return res.status(200).json(card.checklists[req.params.checklistId]);
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.get(
  "/:id/checklist/:checklistId/item/:checklistItemId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        return res.json(
          card.checklists[req.params.checklistId].items[
            req.params.checklistItemId
          ]
        );
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.get(
  "/:id/checklist/:checklistId/item",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        return res
          .status(200)
          .json(card.checklists[req.params.checklistId].items);
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.patch(
  "/:id/checklist/:checklistId/item/:checklistItemId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        if (req.body.complete) {
          card.markChecklistItemComplete(
            req.params.checklistId,
            req.params.checklistItemId,
            req.user
          );
        } else {
          card.markChecklistItemIncomplete(
            req.params.checklistId,
            req.params.checklistItemId,
            req.user
          );
        }
        if (req.body.text) {
          card.editChecklistItem(
            req.params.checklistId,
            req.params.checklistItemId,
            { text: req.body.text },
            req.user
          );
        }
        card.save().then(card => {
          return res.status(200).json(card);
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.put(
  "/:id/checklist/:checklistId/item/:checklistItemId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        card.editChecklistItem(
          req.params.checklistId,
          req.params.checklistItemId,
          req.body,
          req.user
        );
        card.save().then(card => {
          return res.status(200).json(card);
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

cardController.delete(
  "/:id/checklist/:checklistId/item/:checklistItemId",
  authenticationMiddleware,
  (req, res) => {
    Card.findById(req.params.id)
      .then(card => {
        if (!card) {
          return res.status(404).json("Card not found.");
        }
        card.removeChecklistItem(
          req.params.checklistId,
          req.params.checklistItemId,
          req.user
        );
        card.save().then(card => {
          return res.status(204).json("Checklist item deleted.");
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

export default cardController;
