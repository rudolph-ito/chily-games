import express from "express";
import {
  ICyvasseChallengeService,
  CyvasseChallengeService,
} from "../services/cyvasse_challenge_service";
import { IUser } from "../shared/dtos/authentication";
import HttpStatus from "http-status-codes";

export function getChallengeRouter(
  authenticationRequired: express.Handler,
  challengeService: ICyvasseChallengeService = new CyvasseChallengeService()
): express.Router {
  const router = express.Router();
  router.post("/search", function (req, res, next) {
    challengeService
      .searchChallenges(req.body)
      .then((paginatedChallenges) => {
        res.json(paginatedChallenges);
      })
      .catch(next);
  });
  router.post("/", authenticationRequired, function (req, res, next) {
    challengeService
      .createChallenge((req.user as IUser).userId, req.body)
      .then((challenge) => {
        res.json(challenge);
      })
      .catch(next);
  });
  router.delete("/:challengeId", authenticationRequired, function (
    req,
    res,
    next
  ) {
    challengeService
      .deleteChallenge(
        (req.user as IUser).userId,
        parseInt(req.params.challengeId)
      )
      .then(() => {
        res.end();
      })
      .catch(next);
  });
  router.post("/:challengeId/accept", authenticationRequired, function (
    req,
    res,
    next
  ) {
    challengeService
      .acceptChallenge(
        (req.user as IUser).userId,
        parseInt(req.params.challengeId)
      )
      .then((game) => {
        res.status(HttpStatus.OK).json(game);
      })
      .catch(next);
  });
  router.post("/:challengeId/decline", authenticationRequired, function (
    req,
    res,
    next
  ) {
    challengeService
      .declineChallenge(
        (req.user as IUser).userId,
        parseInt(req.params.challengeId)
      )
      .then(() => {
        res.end();
      })
      .catch(next);
  });
  return router;
}
