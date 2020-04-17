import { describe, it } from "mocha";
import { register } from "./registration_service";
import { expect } from "chai";
import { resetDatabaseBeforeEach } from "../../test/test_helper";

const weakPassword = "weak";
const strongPassword = "strong enough";

describe("RegistrationService", () => {
  resetDatabaseBeforeEach();

  describe("register", () => {
    it("returns error if missing username", async () => {
      // Arrange

      // Act
      const result = await register({
        username: "",
        password: strongPassword,
        passwordConfirmation: strongPassword
      });

      // Assert
      expect(result.errors).to.eql({
        username: "Username is required"
      });
    });

    it("returns error if missing password", async () => {
      // Arrange

      // Act
      const result = await register({
        username: "me",
        password: "",
        passwordConfirmation: ""
      });

      // Assert
      expect(result.errors).to.eql({
        password: "Password is required"
      });
    });

    it("returns error if password not strong enough", async () => {
      // Arrange

      // Act
      const result = await register({
        username: "me",
        password: weakPassword,
        passwordConfirmation: weakPassword
      });

      // Assert
      expect(result.errors).to.eql({
        password:
          "Password is not strong enough: Add another word or two. Uncommon words are better."
      });
    });

    it("returns error if password does not match password confirmation", async () => {
      // Arrange

      // Act
      const result = await register({
        username: "me",
        password: strongPassword,
        passwordConfirmation: weakPassword
      });

      // Assert
      expect(result.errors).to.eql({
        passwordConfirmation: "Password confirmation does not match password"
      });
    });

    it("returns error if username already taken", async () => {
      // TODO
    });

    it("returns user if given valid credentials", async () => {
      // Arrange

      // Act
      const result = await register({
        username: "user1",
        password: strongPassword,
        passwordConfirmation: strongPassword
      });

      // Assert
      expect(result.errors).to.be.undefined();
      expect(result.user.userId).not.to.be.undefined();
      expect(result.user.username).to.eql("user1");
    });
  });
});
