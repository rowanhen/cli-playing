import { describe, expect, it } from "vitest";
import { createGithubRelease } from "../funcs/github-release.js";
import type { AnalysisResult } from "../types.js";

describe("github-release", () => {
  describe("createGithubRelease", () => {
    it("should throw error when analysis has error", async () => {
      const analysis: AnalysisResult = {
        error: "Test error",
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      await expect(createGithubRelease(analysis)).rejects.toThrow("Test error");
    });

    it("should handle dry run with skipAuth correctly", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: {
          Features: ["Add new authentication system"],
          "Bug Fixes": ["Fix login redirect issue"],
        },
      };

      const result = await createGithubRelease(analysis, true, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.version).toBe("1.1.0");
      expect(result.tag).toBe("v1.1.0");
      expect(result.name).toBe("v1.1.0");
      expect(result.prerelease).toBe(false);
      expect(result.releaseNotes).toContain("## Features");
      expect(result.releaseNotes).toContain("- Add new authentication system");
      expect(result.releaseNotes).toContain("## Bug Fixes");
      expect(result.releaseNotes).toContain("- Fix login redirect issue");
      expect(result.authValidation.error).toBe("Skipped (--skip-github)");
    });

    it("should handle prerelease versions correctly", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0-beta.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: {
          Features: ["Add experimental feature"],
        },
        isPrerelease: true,
      };

      const result = await createGithubRelease(analysis, true, true);

      expect(result.prerelease).toBe(true);
      expect(result.tag).toBe("v1.1.0-beta.1");
      expect(result.version).toBe("1.1.0-beta.1");
    });

    it("should format release notes correctly", async () => {
      const analysis: AnalysisResult = {
        bump: "major",
        version: "2.0.0",
        currentVersion: "1.5.0",
        hasChanges: true,
        changes: {
          "BREAKING CHANGES": ["Remove deprecated API endpoints"],
          Features: ["New API v2", "Enhanced security"],
          "Bug Fixes": ["Fix data corruption issue"],
          Documentation: ["Update API docs"],
        },
      };

      const result = await createGithubRelease(analysis, true, true);

      expect(result.releaseNotes).toContain("## BREAKING CHANGES");
      expect(result.releaseNotes).toContain(
        "- Remove deprecated API endpoints"
      );
      expect(result.releaseNotes).toContain("## Features");
      expect(result.releaseNotes).toContain("- New API v2");
      expect(result.releaseNotes).toContain("- Enhanced security");
      expect(result.releaseNotes).toContain("## Bug Fixes");
      expect(result.releaseNotes).toContain("- Fix data corruption issue");
      expect(result.releaseNotes).toContain("## Documentation");
      expect(result.releaseNotes).toContain("- Update API docs");
    });

    it("should handle empty changes gracefully", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      const result = await createGithubRelease(analysis, true, true);

      expect(result.success).toBe(true);
      expect(result.releaseNotes).toBe("");
    });

    it("should throw error when GITHUB_TOKEN is missing and not skipping auth", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      // Temporarily remove GITHUB_TOKEN if it exists
      const originalToken = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;

      try {
        await expect(
          createGithubRelease(analysis, true, false)
        ).rejects.toThrow(
          "GITHUB_TOKEN environment variable is required for GitHub releases"
        );
      } finally {
        // Restore original token
        if (originalToken) {
          process.env.GITHUB_TOKEN = originalToken;
        }
      }
    });

    it("should format tag correctly for different version patterns", async () => {
      const testCases = [
        { version: "1.0.0", expectedTag: "v1.0.0" },
        { version: "2.5.3", expectedTag: "v2.5.3" },
        { version: "10.0.0", expectedTag: "v10.0.0" },
        { version: "1.0.0-alpha.1", expectedTag: "v1.0.0-alpha.1" },
        { version: "3.0.0-beta.2", expectedTag: "v3.0.0-beta.2" },
      ];

      for (const testCase of testCases) {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: testCase.version,
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["test"] },
        };

        const result = await createGithubRelease(analysis, true, true);
        expect(result.tag).toBe(testCase.expectedTag);
        expect(result.name).toBe(testCase.expectedTag);
      }
    });

    it("should default prerelease to false when not specified", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { "Bug Fixes": ["fix"] },
      };

      const result = await createGithubRelease(analysis, true, true);

      expect(result.prerelease).toBe(false);
    });
  });
});
