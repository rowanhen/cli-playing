import { describe, expect, it } from "vitest";
import { publishNpm } from "../funcs/npm-publisher.js";
import type { AnalysisResult } from "../types.js";

describe("npm-publisher", () => {
  describe("publishNpm", () => {
    it("should throw error when analysis has error", async () => {
      const analysis: AnalysisResult = {
        error: "Test error",
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      await expect(publishNpm(analysis)).rejects.toThrow("Test error");
    });

    it("should handle dry run mode correctly", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      // Test dry run with skipAuth
      const result = await publishNpm(analysis, true, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.version).toBe("1.1.0");
      expect(result.tag).toBe("latest");
      expect(result.fullPackageName).toContain("@1.1.0");
      expect(result.registry).toBe("https://registry.npmjs.org");
      expect(result.publishCommand).toBe("npm publish --tag latest");
      expect(result.authValidation.error).toBe("Skipped (--skip-npm)");
    });

    it("should set correct tag for prerelease versions", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0-beta.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
        isPrerelease: true,
      };

      const result = await publishNpm(analysis, true, true);

      expect(result.tag).toBe("next");
      expect(result.publishCommand).toBe("npm publish --tag next");
    });

    it("should detect scoped packages correctly", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      const result = await publishNpm(analysis, true, true);

      // The actual package is scoped (@super-secret-test-org/simple-versioning)
      expect(result.isScoped).toBe(true);
      expect(result.scope).toBe("@super-secret-test-org");
    });

    it("should throw error when NPM_TOKEN is missing and not skipping auth", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: { Features: ["new feature"] },
      };

      // Temporarily remove NPM_TOKEN if it exists
      const originalToken = process.env.NPM_TOKEN;
      delete process.env.NPM_TOKEN;

      try {
        await expect(publishNpm(analysis, true, false)).rejects.toThrow(
          "NPM authentication token not found. Set NPM_TOKEN environment variable."
        );
      } finally {
        // Restore original token
        if (originalToken) {
          process.env.NPM_TOKEN = originalToken;
        }
      }
    });
  });
});
