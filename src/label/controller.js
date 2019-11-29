import { Label } from "./model";
import { authenticationMiddleware } from "auth";
import { Controller } from "common/controller";
const labelController = new Controller("/labels");
const INTERNAL_SERVER_ERROR = "Internal Server Error";

labelController.post("/", authenticationMiddleware, (req, res) => {
  const newLabel = new Label(req.body);
  return newLabel
    .save()
    .then(newLabel => {
      return res.json(newLabel);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

labelController.get("/:id", authenticationMiddleware, (req, res) => {
  Label.findById(req.params.id)
    .then(label => {
      if (!label) {
        return res.status(404).json("Label not found.");
      }
      return res.status(200).json(label);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

labelController.get("/", authenticationMiddleware, (req, res) => {
  Label.find()
    .then(labels => {
      if (!labels) {
        return res.status(404).json("Labels not found.");
      }
      return res.status(200).json(labels);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

labelController.put("/:id", authenticationMiddleware, (req, res) => {
  const put = new Label(req.body);
  put
    .validate()
    .then(() => {
      return Label.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true
      })
        .then(label => {
          return res.status(200).json(label);
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

labelController.patch("/:id", authenticationMiddleware, (req, res) => {
  Label.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body },
    {
      new: true
    }
  )
    .then(label => {
      return res.status(200).json(label);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

labelController.delete("/:id", authenticationMiddleware, (req, res) => {
  Card.find({ labels: [{ _id: req.params.id }] })
    .then(cards => {
      if (!cards) {
        return;
      }
      let result = Promise.resolve();
      cards.forEach(card => {
        card.removeLabel(req.params.id, req.user);
        result = result.then(card.save);
      });
      return result;
    })
    .then(() => {
      Label.remove({ _id: req.params.id }).then(() => {
        return res.status(204).json("Label deleted.");
      });
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

export default labelController;
