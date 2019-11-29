import { Board } from "./model";
import { Card } from "card/model";
import { authenticationMiddleware } from "auth";
import { Controller } from "common/controller";

const boardController = new Controller("/boards");
const INTERNAL_SERVER_ERROR = "Internal Server Error";

boardController.post("/", authenticationMiddleware, (req, res) => {
  const newBoard = new Board(req.body);
  return newBoard
    .save()
    .then(newBoard => {
      return res.json(newBoard);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

boardController.get("/:id", authenticationMiddleware, (req, res) => {
  Board.findById(req.params.id)
    .then(board => {
      if (!board) {
        return res.status(404).json("Board not found.");
      }
      return res.status(200).json(board);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

boardController.get("/", authenticationMiddleware, (req, res) => {
  Board.find()
    .then(boards => {
      if (!boards) {
        return res.status(404).json("Boards not found.");
      }
      return res.status(200).json(boards);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

boardController.put("/:id", authenticationMiddleware, (req, res) => {
  const put = new Board(req.body);
  put
    .validate()
    .then(() => {
      return Board.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true
      })
        .then(board => {
          return res.status(200).json(board);
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

boardController.patch("/:id", authenticationMiddleware, (req, res) => {
  Board.findOneAndUpdate(
    { _id: req.params.id },
    { $set: req.body },
    {
      new: true
    }
  )
    .then(board => {
      return res.status(200).json(board);
    })
    .catch(err => {
      console.log(err.message);
      return res.status(500).json(INTERNAL_SERVER_ERROR);
    });
});

boardController.delete("/:id", authenticationMiddleware, (req, res) => {
  Board.findById(req.params.id)
    .populate("cards")
    .then(board => {
      let result = Promise.resolve();
      board.cards.forEach(card => {
        result = result.then(card.delete);
      });
      result
        .then(board.delete)
        .then(() => {
          return res.status(204).send();
        })
        .catch(err => {
          console.log(err.message);
          return res.status(500).json(INTERNAL_SERVER_ERROR);
        });
    });
});

boardController.post(
  "/:id/columns/:columnId/card",
  authenticationMiddleware,
  (req, res) => {
    Board.findById(req.params.id)
      .then(board => {
        const columnIndex = board.columns.findIndex(column => {
          return column._id.toString() === req.params.columnId;
        });
        if (columnIndex <= -1) {
          return res.status(404).json("Could not find column.");
        }
        const column = board.columns[columnIndex];
        const card = new Card(req.body);
        card.save().then(card => {
          board.columns[columnIndex].push({
            card: card._id,
            position: req.body.position || 0
          });
          board.save();
          return res.status(200).json(card);
        });
      })
      .catch(err => {
        console.log(err.message);
        return res.status(500).json(INTERNAL_SERVER_ERROR);
      });
  }
);

export default boardController;
