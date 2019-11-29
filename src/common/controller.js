import { Router } from "express";

export default class Controller {
  baseRoute;
  router;
  constructor(baseRoute) {
    this.router = Router();
    this.baseRoute = baseRoute;

    this.get = this.router.get.bind(this.router);
    this.post = this.router.post.bind(this.router);
    this.put = this.router.put.bind(this.router);
    this.patch = this.router.patch.bind(this.router);
    this.delete = this.router.delete.bind(this.router);
    return this;
  }
  // post = (...args) => {
  //   console.log(args);
  //   this.router.post.call(this.router, ...args);
  // };
}
