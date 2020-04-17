import { describe, it } from "mocha";
import { createExpressApp } from "./";
import { expect } from "chai";
import { resetDatabaseBeforeEach } from "../../test/test_helper";
import supertest from "supertest";
import { User } from "../database/models";

describe("AuthRoutes", () => {
  resetDatabaseBeforeEach();
  const app = createExpressApp({
    corsOrigins: [],
    sessionCookieSecure: false,
    sessionSecret: "test"
  });

  describe("accessing protected routes while not logged in", () => {
    it("if not logged in, /api/auth/user returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .get("/api/auth/user")
        .expect(401);

      // Assert
    });

    it("if not logged in, /api/auth/logout returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .delete("/api/auth/logout")
        .expect(401);

      // Assert
    });
  });

  describe("login / logout flow", () => {
    it("on failed login (wrong password), returns 401", async () => {
      // Arrange
      const username = "test";
      const password = "strong enough";
      const user = User.build({ username: username });
      user.setPassword(password);
      await user.save();

      // Act
      await supertest(app)
        .post("/api/auth/login")
        .send({ username, password: "wrong" })
        .expect(401);

      // Assert
    });

    it("on falied login (user does not exist), returns 401", async () => {
      // Arrange

      // Act
      await supertest(app)
        .post("/api/auth/login")
        .send({ username: "non-existant", password: "wrong" })
        .expect(401);

      // Assert
    });

    describe("on successful login", () => {
      let agent;
      const username = "test";

      beforeEach(async () => {
        const password = "strong enough";
        const user = User.build({ username: username });
        user.setPassword(password);
        await user.save();

        agent = supertest.agent(app);
        await agent
          .post("/api/auth/login")
          .send({ username, password })
          .expect("set-cookie", /connect\.sid/)
          .expect(200);
      });

      it("can fetch user data", async () => {
        // Arrange

        // Act
        const response = await agent.get("/api/auth/user").expect(200);

        // Assert
        expect(response.body).to.eql({
          userId: 1,
          username
        });
      });

      it("can logout, which prevents further access to protected resources", async () => {
        // Arrange

        // Act
        await agent.delete("/api/auth/logout").expect(200);

        // Assert
        await agent.get("/api/auth/user").expect(401);
      });
    });

    it("on successful login, can fetch user data", async () => {
      // Arrange
      const username = "test";
      const password = "strong enough";
      const user = User.build({ username: username });
      user.setPassword(password);
      await user.save();

      const agent = supertest.agent(app);
      await agent
        .post("/api/auth/login")
        .send({ username, password })
        .expect("set-cookie", /connect\.sid/)
        .expect(200);

      // Act
      const response = await agent.get("/api/auth/user").expect(200);

      // Assert
      expect(response.body).to.eql({
        userId: 1,
        username
      });
    });
  });

  describe("register flow", () => {
    it("on validation error, it returns 424", async () => {
      // Arrange

      // Act
      const response = await supertest(app)
        .post("/api/auth/register")
        .send({ username: "", password: "", passwordConfirmation: "" })
        .set("Accept", "application/json")
        .expect("Content-Type", /json/)
        .expect(424);

      // Assert
      expect(response.body).to.eql({
        password: "Password is required",
        username: "Username is required"
      });
    });

    it("on succees, it returns 200 and sets a cookie allowing access to protected routes", async () => {
      // Arrange
      const username = "test";
      const password = "strong enough";
      const agent = supertest.agent(app);

      // Act
      await agent
        .post("/api/auth/register")
        .send({ username, password, passwordConfirmation: password })
        .set("Accept", "application/json")
        .expect("set-cookie", /connect\.sid/)
        .expect(200);

      // Assert
      await agent.get("/api/auth/user").expect(200);
    });
  });
});
