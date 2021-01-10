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
      let err: ValidationError | null = null;

      // Act
      try {
        await service.register({
          username: "",
          displayName: "Me",
          password: strongPassword,
          passwordConfirmation: strongPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err?.errors).to.eql({
        username: "Username is required",
      });
    });

    it("throws ValidationError if missing displayName", async () => {
      // Arrange
      let err: ValidationError | null = null;

      // Act
      try {
        await service.register({
          username: "me",
          displayName: "",
          password: strongPassword,
          passwordConfirmation: strongPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err?.errors).to.eql({
        displayName: "Display Name is required",
      });
    });

    it("throws ValidationError if missing password", async () => {
      // Arrange
      let err: ValidationError | null = null;

      // Act
      try {
        await service.register({
          username: "me",
          displayName: "Me",
          password: "",
          passwordConfirmation: "",
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err?.errors).to.eql({
        password: "Password is required",
      });
    });

    it("throws ValidationError if password not strong enough", async () => {
      // Arrange
      let err: ValidationError | null = null;

      // Act
      try {
        await service.register({
          username: "me",
          displayName: "Me",
          password: weakPassword,
          passwordConfirmation: weakPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err?.errors).to.eql({
        password:
          "Password is not strong enough: Add another word or two. Uncommon words are better.",
      });
    });

    it("throws ValidationError if password does not match password confirmation", async () => {
      // Arrange
      let err: ValidationError | null = null;

      // Act
      try {
        await service.register({
          username: "me",
          displayName: "Me",
          password: strongPassword,
          passwordConfirmation: weakPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err?.errors).to.eql({
        passwordConfirmation: "Password confirmation does not match password",
      });
    });

    it("throws ValidationError if username already taken", async () => {
      // Arrange
      await createTestUser({ username: "me" });
      let err: ValidationError | null = null;

      // Act
      try {
        await service.register({
          username: "me",
          displayName: "Me",
          password: strongPassword,
          passwordConfirmation: strongPassword,
        });
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err?.errors).to.eql({
        username: "Username 'me' is already taken",
      });
    });

    it("returns user if given valid credentials", async () => {
      // Arrange

      // Act
      const user = await service.register({
        username: "user1",
        displayName: "Me",
        password: strongPassword,
        passwordConfirmation: strongPassword,
      });

      // Assert
      expect(user.userId).not.to.be.undefined();
      expect(user.username).to.eql("user1");
    });
  });

  describe("getNextGuestUsername", () => {
    it("returns guest0 if no guests exist", async () => {
      // Arrange

      // Act
      const username = await service.getNextGuestUsername();

      // Assert
      expect(username).to.eql("guest0");
    });

    it("returns guest1 if guest0 is the latest guest to exist", async () => {
      // Arrange
      await createTestUser({ username: "guest0" });

      // Act
      const username = await service.getNextGuestUsername();

      // Assert
      expect(username).to.eql("guest1");
    });

    it("returns guest10 if guest9 is the latest guest to exist", async () => {
      // Arrange
      await createTestUser({ username: "guest3" });
      await createTestUser({ username: "guest6" });
      await createTestUser({ username: "guest9" });

      // Act
      const username = await service.getNextGuestUsername();

      // Assert
      expect(username).to.eql("guest10");
    });
  });
});
