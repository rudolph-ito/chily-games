import express from "express";
import passport from "passport";
import { Strategy as JsonStrategy } from "passport-json";
import { User } from "../database/models";
import { IUser } from "../shared/dtos/authentication";
import { UserDataService } from "../services/shared/data/user_data_service";
import { RegistrationService } from "../services/shared/registration_service";
import { StatusCodes } from "http-status-codes";

async function verifyLogin(
  username: string,
  password: string
): Promise<boolean | IUser> {
  const user = await User.findOne({ where: { username } });
  if (user == null) {
    return false;
  }
  return user.isPasswordValid(password) ? user.serialize() : false;
}

function getJsonStrategy(): passport.Strategy {
  return new JsonStrategy(function (username, password, done) {
    verifyLogin(username, password)
      .then((result) => done(null, result))
      .catch((err) => done(err));
  });
}

function configurePassport(): void {
  passport.use(getJsonStrategy());
  passport.serializeUser(function (user: User, done) {
    done(null, user.userId);
  });
  passport.deserializeUser(function (id: number, done) {
    new UserDataService()
      .getMaybeUser(id)
      .then((user) => done(null, user))
      .catch((err: Error) => done(err));
  });
}

function getAuthRouter(
  authenticationRequired: express.Handler,
  registrationService: RegistrationService = new RegistrationService()
): express.Router {
  const router = express.Router();
  router.get("/next_guest_username", function (req, res, next) {
    registrationService
      .getNextGuestUsername()
      .then((username) => {
        res.status(StatusCodes.OK).json(username);
      })
      .catch(next);
  });
  router.post("/register", function (req, res, next) {
    registrationService
      .register(req.body)
      .then((user) => {
        req.login(user, (err) => {
          if (err != null) {
            next(err);
          } else {
            res.status(StatusCodes.OK).json(user);
          }
        });
      })
      .catch(next);
  });
  router.post("/login", passport.authenticate("json"), function (req, res) {
    res.json(req.user);
  });
  router.delete("/logout", authenticationRequired, function (req, res, next) {
    req.logout((err) => {
      if (err) {
        next(err);
      } else {
        res.end();
      }
    });
  });
  router.get("/user", authenticationRequired, function (req, res) {
    res.json(req.user);
  });
  return router;
}

export function initAuthController(
  app: express.Express,
  routePrefix: string
): express.Handler {
  const authenticationRequired: express.Handler = function (req, res, next) {
    if (req.user != null) {
      next();
    } else {
      res.status(StatusCodes.UNAUTHORIZED).end();
    }
  };

  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(routePrefix, getAuthRouter(authenticationRequired));
  return authenticationRequired;
}
