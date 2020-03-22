import { Express } from "express";
import * as passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "../database/models";
import { doesNotHaveValue } from "../shared/utilities/value_checker";

async function verifyLogin(
  email: string,
  password: string
): Promise<boolean | User> {
  const user: User = await User.findOne({ where: { email } });
  if (doesNotHaveValue(user)) {
    return false;
  }
  return user.isPasswordValid(password) ? user : false;
}

function getLocalStrategy(): passport.Strategy {
  const options = {
    usernameField: "email"
  };
  return new LocalStrategy(options, function(email, password, done) {
    verifyLogin(email, password)
      .then(result => done(null, result))
      .catch(err => done(err));
  });
}

export function setupAuth(app: Express): void {
  passport.use(getLocalStrategy());
  passport.serializeUser(function(user: User, done) {
    done(null, user.userId);
  });
  passport.deserializeUser(function(id: number, done) {
    User.findByPk(id)
      .then((user: User) => done(null, user))
      .catch((err: Error) => done(err));
  });

  app.use(passport.initialize());
  app.use(passport.session());
  app.post("/api/auth/login", passport.authenticate("local"));
}
