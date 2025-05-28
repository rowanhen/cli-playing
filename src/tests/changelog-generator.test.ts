import { describe, expect, it } from "vitest";
import { generateChangelog } from "../funcs/changelog-generator.js";
import type { AnalysisResult } from "../types.js";

describe("changelog-generator", () => {
  describe("generateChangelog", () => {
    it("should throw error when analysis has error", async () => {
      const analysis: AnalysisResult = {
        error: "Test error",
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      await expect(generateChangelog(analysis)).rejects.toThrow("Test error");
    });

    it("should skip when no changes to document", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: false,
        changes: {},
      };

      const result = await generateChangelog(analysis, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.skipped).toBe(true);
      expect(result.reason).toBe("No visible changes to document");
    });

    it("should generate changelog entry for changes", async () => {
      const analysis: AnalysisResult = {
        bump: "minor",
        version: "1.1.0",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: {
          Features: [
            "Add new authentication system",
            "Implement user dashboard",
          ],
          "Bug Fixes": [
            "Fix login redirect issue",
            "Resolve memory leak in parser",
          ],
          Documentation: ["Update API documentation"],
        },
      };

      const result = await generateChangelog(analysis, true);

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.version).toBe("1.1.0");
      expect(result.sections).toEqual([
        "Features",
        "Bug Fixes",
        "Documentation",
      ]);
      expect(result.changelogEntry).toContain("## [1.1.0]");
      expect(result.changelogEntry).toContain("### Features");
      expect(result.changelogEntry).toContain(
        "- Add new authentication system"
      );
      expect(result.changelogEntry).toContain("- Implement user dashboard");
      expect(result.changelogEntry).toContain("### Bug Fixes");
      expect(result.changelogEntry).toContain("- Fix login redirect issue");
      expect(result.changelogEntry).toContain(
        "- Resolve memory leak in parser"
      );
      expect(result.changelogEntry).toContain("### Documentation");
      expect(result.changelogEntry).toContain("- Update API documentation");
    });

    it("should handle single change type", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: {
          "Bug Fixes": ["Fix critical security vulnerability"],
        },
      };

      const result = await generateChangelog(analysis, true);

      expect(result.success).toBe(true);
      expect(result.sections).toEqual(["Bug Fixes"]);
      expect(result.changelogEntry).toContain("## [1.0.1]");
      expect(result.changelogEntry).toContain("### Bug Fixes");
      expect(result.changelogEntry).toContain(
        "- Fix critical security vulnerability"
      );
    });

    it("should handle prerelease versions", async () => {
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

      const result = await generateChangelog(analysis, true);

      expect(result.success).toBe(true);
      expect(result.version).toBe("1.1.0-beta.1");
      expect(result.changelogEntry).toContain("## [1.1.0-beta.1]");
      expect(result.changelogEntry).toContain("### Features");
      expect(result.changelogEntry).toContain("- Add experimental feature");
    });

    it("should format changelog entry with proper structure", async () => {
      const analysis: AnalysisResult = {
        bump: "major",
        version: "2.0.0",
        currentVersion: "1.5.0",
        hasChanges: true,
        changes: {
          "BREAKING CHANGES": ["Remove deprecated API endpoints"],
          Features: ["New API v2"],
          "Bug Fixes": ["Fix data corruption issue"],
        },
      };

      const result = await generateChangelog(analysis, true);

      expect(result.success).toBe(true);
      expect(result.changelogEntry).toMatch(
        /^## \[2\.0\.0\] - \d{4}-\d{2}-\d{2}/
      );

      // Check that sections are in the right order and format
      const entry = result.changelogEntry!;
      const breakingIndex = entry.indexOf("### BREAKING CHANGES");
      const featuresIndex = entry.indexOf("### Features");
      const bugFixesIndex = entry.indexOf("### Bug Fixes");

      expect(breakingIndex).toBeGreaterThan(-1);
      expect(featuresIndex).toBeGreaterThan(breakingIndex);
      expect(bugFixesIndex).toBeGreaterThan(featuresIndex);
    });

    it("should include date in changelog entry", async () => {
      const analysis: AnalysisResult = {
        bump: "patch",
        version: "1.0.1",
        currentVersion: "1.0.0",
        hasChanges: true,
        changes: {
          "Bug Fixes": ["Fix issue"],
        },
      };

      const result = await generateChangelog(analysis, true);
      const today = new Date().toISOString().split("T")[0];

      expect(result.changelogEntry).toContain(`## [1.0.1] - ${today}`);
    });
  });
});
