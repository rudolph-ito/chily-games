import { describe, it } from "mocha";
import { User } from "./user";
import { expect } from "chai";

describe("User", () => {
  describe("isPasswordValid", () => {
    it("returns true if the password matches", () => {
      // Arrange
      const user = User.build();
      const password = "test";
      user.setPassword(password);

      // Act
      const result = user.isPasswordValid(password);

      // Assert
      expect(result).to.eql(true);
    });

    it("returns false if the password does not match", () => {
      // Arrange
      const user = User.build();
      const password = "test";
      user.setPassword(password);

      // Act
      const result = user.isPasswordValid("other");

      // Assert
      expect(result).to.eql(false);
    });
  });
});
