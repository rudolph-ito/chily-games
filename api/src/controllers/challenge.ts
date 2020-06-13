import express from "express";
import {
  IChallengeService,
  ChallengeService,
} from "../services/challenge_service";
import { IUser } from "../shared/dtos/authentication";

export function getChallengeRouter(
  authenticationRequired: express.Handler,
  challengeService: IChallengeService = new ChallengeService()
): express.Router {
  const router = express.Router();
  router.post("/search", function (req, res, next) {
    challengeService
      .searchChallenges(req.body)
      .then((paginatedChallenges) => {
        res.status(200).send(paginatedChallenges);
      })
      .catch(next);
  });
  router.post("/", authenticationRequired, function (req, res, next) {
    challengeService
      .createChallenge((req.user as IUser).userId, req.body)
      .then((challenge) => {
        res.status(200).send(challenge);
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
        res.status(200).end();
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
        res.status(200).send(game);
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
        res.status(200).end();
      })
      .catch(next);
  });
  return router;
}
