import bodyParser from "body-parser";
import { authController } from "auth";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import { userController } from "user";
import { projectController } from "project";
import { boardController } from "board";
import { cardController } from "card";
import { labelController } from "label";

const SERVER_PORT = process.env.SERVER_PORT;
const MONGO_URI = process.env.MONGO_URI;

const ORIGINS = process.env.CORS_ORIGINS.split(",");
mongoose.connect(MONGO_URI, err => {
  if (err) {
    throw err;
  }
});
mongoose.Promise = global.Promise;

const app = express();
// https logger middleware -> log a request came in
app.use(morgan("tiny"));
// is valid request
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || ORIGINS.indexOf(origin) !== -1) {
        return cb(null, true);
      }
      return cb("Bad request.");
    },
    credentials: true
  })
);

// decodes the http request
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// authentication
app.use(authController.baseRoute, authController.router);
app.use(userController.baseRoute, userController.router);
app.use(projectController.baseRoute, projectController.router);
app.use(boardController.baseRoute, boardController.router);
app.use(cardController.baseRoute, cardController.router);
app.use(labelController.baseRoute, labelController.router);
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).end();
});

app.listen(SERVER_PORT, err => {
  if (err) {
    throw err;
  }
  console.info(`Server is listening on port ${SERVER_PORT}.`);
});
