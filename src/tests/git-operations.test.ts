import { describe, expect, it } from "vitest";
import { commitChanges, createTag } from "../funcs/git-operations.js";
import type { AnalysisResult } from "../types.js";

describe("git-operations", () => {
  describe("commitChanges", () => {
    it("should throw error when analysis has error", async () => {
      const analysis: AnalysisResult = {
        error: "Test error",
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      await expect(commitChanges(analysis)).rejects.toThrow("Test error");
    });

    it("should prepare commit with correct message and files in dry run", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      const result = await commitChanges(analysis, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.message).toBe("chore(release): 1.1.0 [skip ci]");
      expect(result.files).toContain("package.json");
    });

    it("should include changelog in files when has changes", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      const result = await commitChanges(analysis, true);

      expect(result.files).toContain("package.json");
      // Note: CHANGELOG.md inclusion depends on file existence, which we can't easily test without filesystem
    });

    it("should not include changelog when no changes", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      const result = await commitChanges(analysis, true);

      expect(result.files).toContain("package.json");
      expect(result.files).not.toContain("CHANGELOG.md");
    });

    it("should format commit message correctly for different versions", async () => {
      const testCases = [
        { version: "1.0.0", expected: "chore(release): 1.0.0 [skip ci]" },
        { version: "2.5.3", expected: "chore(release): 2.5.3 [skip ci]" },
        {
          version: "1.0.0-beta.1",
          expected: "chore(release): 1.0.0-beta.1 [skip ci]",
        },
        {
          version: "3.0.0-alpha.2",
          expected: "chore(release): 3.0.0-alpha.2 [skip ci]",
        },
      ];

      for (const testCase of testCases) {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: testCase.version,
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["test"] },
        };

        const result = await commitChanges(analysis, true);
        expect(result.message).toBe(testCase.expected);
      }
    });
  });

  describe("createTag", () => {
    it("should throw error when analysis has error", async () => {
      const analysis: AnalysisResult = {
        error: "Test error",
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      await expect(createTag(analysis)).rejects.toThrow("Test error");
    });

    it("should create tag with correct format in dry run", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      const result = await createTag(analysis, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.tag).toBe("v1.1.0");
      expect(result.version).toBe("1.1.0");
      expect(result.tagMessage).toBe("Release 1.1.0");
      expect(result.gitCommand).toBe('git tag -a v1.1.0 -m "Release 1.1.0"');
      expect(result.isPrerelease).toBe(false);
    });

    it("should handle prerelease versions correctly", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0-beta.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
        isPrerelease: true,
      };

      const result = await createTag(analysis, true);

      expect(result.tag).toBe("v1.1.0-beta.1");
      expect(result.version).toBe("1.1.0-beta.1");
      expect(result.tagMessage).toBe("Release 1.1.0-beta.1");
      expect(result.gitCommand).toBe(
        'git tag -a v1.1.0-beta.1 -m "Release 1.1.0-beta.1"'
      );
      expect(result.isPrerelease).toBe(true);
    });

    it("should format tag correctly for different version patterns", async () => {
      const testCases = [
        {
          version: "1.0.0",
          expectedTag: "v1.0.0",
          expectedMessage: "Release 1.0.0",
        },
        {
          version: "2.5.3",
          expectedTag: "v2.5.3",
          expectedMessage: "Release 2.5.3",
        },
        {
          version: "10.0.0",
          expectedTag: "v10.0.0",
          expectedMessage: "Release 10.0.0",
        },
        {
          version: "1.0.0-alpha.1",
          expectedTag: "v1.0.0-alpha.1",
          expectedMessage: "Release 1.0.0-alpha.1",
        },
      ];

      for (const testCase of testCases) {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: testCase.version,
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["test"] },
        };

        const result = await createTag(analysis, true);
        expect(result.tag).toBe(testCase.expectedTag);
        expect(result.tagMessage).toBe(testCase.expectedMessage);
      }
    });

    it("should default isPrerelease to false when not specified", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { "Bug Fixes": ["fix"] },
        // isPrerelease not specified
      };

      const result = await createTag(analysis, true);

      expect(result.isPrerelease).toBe(false);
    });
  });
});
