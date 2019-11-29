import { Router } from "express";
import { returnStatement } from "@babel/types";

// applies catch to async functions if required
function createAction(asyncAction) {
  return (req, res, next) => {
    const result = asyncAction(req, res, next);
    if (result.catch) {
      result.catch(next);
    }
  };
}

// creates wrapper around method which applies createAction around the action functions
function createControllerMethod(method) {
  return (...args) => {
    const rest = args.slice(0, args.length - 1);
    const actionMethod = createAction(args[args.length - 1]);
    method(...rest, actionMethod);
  };
}

export class Controller {
  baseRoute;
  router;
  constructor(baseRoute) {
    this.router = Router();
    this.baseRoute = baseRoute;
    const getMethod = this.router.get.bind(this.router);
    this.get = createControllerMethod(getMethod);
    const postMethod = this.router.post.bind(this.router);
    this.post = createControllerMethod(postMethod);
    const putMethod = this.router.put.bind(this.router);
    this.put = createControllerMethod(putMethod);
    const patchMethod = this.router.patch.bind(this.router);
    this.patch = createControllerMethod(patchMethod);
    const deleteMethod = this.router.delete.bind(this.router);
    this.delete = createControllerMethod(deleteMethod);
    return this;
  }
  // post = (...args) => {
  //   console.log(args);
  //   this.router.post.call(this.router, ...args);
  // };
}
