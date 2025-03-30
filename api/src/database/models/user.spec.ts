import { User } from "./user";

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
      expect(result).toEqual(true);
    });

    it("returns false if the password does not match", () => {
      // Arrange
      const user = User.build();
      const password = "test";
      user.setPassword(password);

      // Act
      const result = user.isPasswordValid("other");

      // Assert
      expect(result).toEqual(false);
    });
  });
});
