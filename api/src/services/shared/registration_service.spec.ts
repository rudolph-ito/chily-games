import { describe, it } from "mocha";
import { RegistrationService } from "./registration_service";
import { expect } from "chai";
import { resetDatabaseBeforeEach } from "../../../test/test_helper";
import { createTestUser } from "../../../test/database_factory";
import { ValidationError } from "./exceptions";

const weakPassword = "weak";
const strongPassword = "strong enough";

describe("RegistrationService", () => {
  resetDatabaseBeforeEach();

  let service: RegistrationService;
  beforeEach(() => {
    service = new RegistrationService();
  });

  describe("register", () => {
    it("throws ValidationError if missing username", async () => {
      // Arrange
      let err: ValidationError;

      // Act
      try {
        await service.register({
          username: "",
          password: strongPassword,
          passwordConfirmation: strongPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err.errors).to.eql({
        username: "Username is required",
      });
    });

    it("throws ValidationError if missing password", async () => {
      // Arrange
      let err: ValidationError;

      // Act
      try {
        await service.register({
          username: "me",
          password: "",
          passwordConfirmation: "",
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err.errors).to.eql({
        password: "Password is required",
      });
    });

    it("throws ValidationError if password not strong enough", async () => {
      // Arrange
      let err: ValidationError;

      // Act
      try {
        await service.register({
          username: "me",
          password: weakPassword,
          passwordConfirmation: weakPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err.errors).to.eql({
        password:
          "Password is not strong enough: Add another word or two. Uncommon words are better.",
      });
    });

    it("throws ValidationError if password does not match password confirmation", async () => {
      // Arrange
      let err: ValidationError;

      // Act
      try {
        await service.register({
          username: "me",
          password: strongPassword,
          passwordConfirmation: weakPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err.errors).to.eql({
        passwordConfirmation: "Password confirmation does not match password",
      });
    });

    it("throws ValidationError if username already taken", async () => {
      // Arrange
      await createTestUser({ username: "me" });
      let err: ValidationError;

      // Act
      try {
        await service.register({
          username: "me",
          password: strongPassword,
          passwordConfirmation: strongPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err.errors).to.eql({
        username: "Username 'me' is already taken",
      });
    });

    it("returns user if given valid credentials", async () => {
      // Arrange

      // Act
      const user = await service.register({
        username: "user1",
        password: strongPassword,
        passwordConfirmation: strongPassword,
      });

      // Assert
      expect(user.userId).not.to.be.undefined();
      expect(user.username).to.eql("user1");
    });
  });
});
