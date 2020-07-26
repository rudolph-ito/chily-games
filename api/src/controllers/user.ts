import express from "express";
import { IUserService, UserService } from "../services/user_service";

export function getUserRouter(
  userService: IUserService = new UserService()
): express.Router {
  const router = express.Router();
  router.get("/:userId", function (req, res, next) {
    userService
      .getUser(parseInt(req.params.userId))
      .then((user) => {
        res.status(200).send(user);
      })
      .catch(next);
  });
  return router;
}
