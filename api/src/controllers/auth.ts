import express from "express";
import passport from "passport";
import { Strategy as JsonStrategy } from "passport-json";
import { User } from "../database/models";
import {
  doesNotHaveValue,
  doesHaveValue
} from "../shared/utilities/value_checker";
import { register } from "../services/registration_service";
import { getUser } from "../services/user_service";
import { IUser } from "../shared/dtos/authentication";

async function verifyLogin(
  username: string,
  password: string
): Promise<boolean | User> {
  const user: User = await User.findOne({ where: { username } });
  if (doesNotHaveValue(user)) {
    return false;
  }
  return user.isPasswordValid(password) ? user : false;
}

function getJsonStrategy(): passport.Strategy {
  return new JsonStrategy(function(username, password, done) {
    verifyLogin(username, password)
      .then(result => done(null, result))
      .catch(err => done(err));
  });
}

function configurePassport(): void {
  passport.use(getJsonStrategy());
  passport.serializeUser(function(user: User, done) {
    done(null, user.userId);
  });
  passport.deserializeUser(function(id: number, done) {
    getUser(id)
      .then((user: IUser) => done(null, user))
      .catch((err: Error) => done(err));
  });
}

function getAuthRouter(
  authenticationRequired: express.Handler
): express.Router {
  const router = express.Router();
  router.post("/register", function(req, res, next) {
    register(req.body)
      .then(({ errors, user }) => {
        if (doesHaveValue(errors)) {
          res.status(424).json(errors);
        } else {
          req.login(user, err => {
            if (doesHaveValue(err)) {
              next(err);
            } else {
              res.status(200).end();
            }
          });
        }
      })
      .catch(next);
  });
  router.post("/login", passport.authenticate("json"), function(req, res) {
    res.status(200).end();
  });
  router.delete("/logout", authenticationRequired, function(req, res) {
    req.logout();
    res.status(200).end();
  });
  router.get("/user", authenticationRequired, function(req, res) {
    res.json(req.user);
  });
  return router;
}

export function initAuthController(
  app: express.Express,
  routePrefix: string
): express.Handler {
  const authenticationRequired: express.Handler = function(req, res, next) {
    if (doesHaveValue(req.user)) {
      next();
    } else {
      res.status(401).end();
    }
  };

  configurePassport();
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(routePrefix, getAuthRouter(authenticationRequired));
  return authenticationRequired;
}
