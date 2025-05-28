import { describe, expect, it } from "vitest";
import { getRepositoryInfo } from "../funcs/repository-utils.js";

describe("repository-utils", () => {
  describe("getRepositoryInfo", () => {
    it("should return repository info or null", () => {
      // This function depends on git remote, so we can't predict the exact result
      // but we can test that it returns the expected structure or null
      const result = getRepositoryInfo();

      if (result !== null) {
        expect(result).toHaveProperty("owner");
        expect(result).toHaveProperty("repo");
        expect(result).toHaveProperty("fullName");
        expect(typeof result.owner).toBe("string");
        expect(typeof result.repo).toBe("string");
        expect(typeof result.fullName).toBe("string");
        expect(result.fullName).toBe(`${result.owner}/${result.repo}`);
      } else {
        expect(result).toBeNull();
      }
    });

    it("should handle the case when git remote is not available", () => {
      // In environments without git or without a remote, it should return null
      // This is a graceful degradation test
      const result = getRepositoryInfo();

      // Result can be either valid repo info or null
      expect(
        result === null ||
          (typeof result === "object" &&
            typeof result.owner === "string" &&
            typeof result.repo === "string" &&
            typeof result.fullName === "string")
      ).toBe(true);
    });

    it("should return consistent fullName format", () => {
      const result = getRepositoryInfo();

      if (result !== null) {
        // fullName should be in the format "owner/repo"
        expect(result.fullName).toMatch(/^[^\/]+\/[^\/]+$/);
        expect(result.fullName.split("/").length).toBe(2);
        expect(result.fullName.split("/")[0]).toBe(result.owner);
        expect(result.fullName.split("/")[1]).toBe(result.repo);
      }
    });

    it("should return strings without leading/trailing whitespace", () => {
      const result = getRepositoryInfo();

      if (result !== null) {
        expect(result.owner).toBe(result.owner.trim());
        expect(result.repo).toBe(result.repo.trim());
        expect(result.fullName).toBe(result.fullName.trim());
      }
    });

    it("should return non-empty strings when result is not null", () => {
      const result = getRepositoryInfo();

      if (result !== null) {
        expect(result.owner.length).toBeGreaterThan(0);
        expect(result.repo.length).toBeGreaterThan(0);
        expect(result.fullName.length).toBeGreaterThan(0);
      }
    });
  });
});
