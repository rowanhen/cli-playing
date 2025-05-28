import { describe, expect, it } from "vitest";
import { bumpPackageVersion } from "../funcs/version-manager.js";
import type { AnalysisResult } from "../types.js";

describe("version-manager", () => {
  describe("bumpPackageVersion", () => {
    it("should throw error when analysis has error", async () => {
      const analysis: AnalysisResult = {
        error: "Test error",
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      await expect(bumpPackageVersion(analysis)).rejects.toThrow("Test error");
    });

    it("should return success result in dry run mode", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      const result = await bumpPackageVersion(analysis, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.newVersion).toBe("1.1.0");
    });

    it("should handle different version bump types", async () => {
      const testCases = [
        { bump: "patch" as const, version: "1.0.1" },
        { bump: "minor" as const, version: "1.1.0" },
        { bump: "major" as const, version: "2.0.0" },
      ];

      for (const testCase of testCases) {
        const analysis: AnalysisResult = {
          bump: testCase.bump,
          version: testCase.version,
          currentVersion: "1.0.0", // This is just for the analysis, actual version comes from package.json
          hasChanges: true,
          changes: { Features: ["test"] },
        };

        const result = await bumpPackageVersion(analysis, true);

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
        expect(result.newVersion).toBe(testCase.version);
        // Don't check oldVersion since it comes from the actual package.json
        expect(result.oldVersion).toBeDefined();
        expect(typeof result.oldVersion).toBe("string");
        expect(result.oldVersion!.length).toBeGreaterThan(0);
      }
    });

    it("should handle prerelease versions", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0-beta.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
        isPrerelease: true,
      };

      const result = await bumpPackageVersion(analysis, true);

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe("1.1.0-beta.1");
    });

    it("should handle version with no changes", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      const result = await bumpPackageVersion(analysis, true);

      expect(result.success).toBe(true);
      expect(result.newVersion).toBe("1.0.1");
    });
  });
});
