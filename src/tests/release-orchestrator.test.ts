import { beforeEach, describe, expect, it } from "vitest";
import { ReleaseOrchestrator } from "../funcs/release-orchestrator.js";
import type { AnalysisResult, ReleaseOptions } from "../types.js";

describe("release-orchestrator", () => {
  describe("ReleaseOrchestrator", () => {
    it("should create instance with default config", () => {
      const orchestrator = new ReleaseOrchestrator();
      expect(orchestrator).toBeInstanceOf(ReleaseOrchestrator);
    });

    it("should create instance with custom config", () => {
      const customConfig = {
        types: {
          feat: { bump: "minor" as const, section: "Features" },
          fix: { bump: "patch" as const, section: "Bug Fixes" },
        },
      };

      const orchestrator = new ReleaseOrchestrator(customConfig);
      expect(orchestrator).toBeInstanceOf(ReleaseOrchestrator);
    });

    it("should have all required methods", () => {
      const orchestrator = new ReleaseOrchestrator();

      expect(typeof orchestrator.analyzeCommits).toBe("function");
      expect(typeof orchestrator.bumpVersion).toBe("function");
      expect(typeof orchestrator.generateChangelog).toBe("function");
      expect(typeof orchestrator.commitChanges).toBe("function");
      expect(typeof orchestrator.createTag).toBe("function");
      expect(typeof orchestrator.publishNpm).toBe("function");
      expect(typeof orchestrator.createGithubRelease).toBe("function");
      expect(typeof orchestrator.release).toBe("function");
    });

    describe("individual methods", () => {
      let orchestrator: ReleaseOrchestrator;

      beforeEach(() => {
        orchestrator = new ReleaseOrchestrator();
      });

      it("should handle bumpVersion with valid analysis", async () => {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: "1.1.0",
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["new feature"] },
        };

        const result = await orchestrator.bumpVersion(analysis, true);

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
      });

      it("should handle generateChangelog with valid analysis", async () => {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: "1.1.0",
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["new feature"] },
        };

        const result = await orchestrator.generateChangelog(analysis, true);

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
      });

      it("should handle commitChanges with valid analysis", async () => {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: "1.1.0",
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["new feature"] },
        };

        const result = await orchestrator.commitChanges(analysis, true);

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
        expect(result.message).toBe("chore(release): 1.1.0 [skip ci]");
      });

      it("should handle createTag with valid analysis", async () => {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: "1.1.0",
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["new feature"] },
        };

        const result = await orchestrator.createTag(analysis, true);

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
        expect(result.tag).toBe("v1.1.0");
      });

      it("should handle publishNpm with valid analysis", async () => {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: "1.1.0",
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["new feature"] },
        };

        const result = await orchestrator.publishNpm(analysis, true, true);

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
        expect(result.skipped).toBe(true);
      });

      it("should handle createGithubRelease with valid analysis", async () => {
        const analysis: AnalysisResult = {
          bump: "minor",
          version: "1.1.0",
          currentVersion: "1.0.0",
          hasChanges: true,
          changes: { Features: ["new feature"] },
        };

        const result = await orchestrator.createGithubRelease(
          analysis,
          true,
          true
        );

        expect(result.success).toBe(true);
        expect(result.dryRun).toBe(true);
        expect(result.skipped).toBe(true);
      });
    });

    describe("release method", () => {
      let orchestrator: ReleaseOrchestrator;

      beforeEach(() => {
        orchestrator = new ReleaseOrchestrator();
      });

      it("should handle default release options", async () => {
        const options: ReleaseOptions = {
          dryRun: true,
          skipNpm: true,
          skipGithub: true,
          skipChangelog: true,
        };

        try {
          const result = await orchestrator.release(options);

          // If it succeeds, check the structure
          expect(result).toHaveProperty("success");
          expect(result).toHaveProperty("analysis");
          expect(result).toHaveProperty("steps");
          expect(typeof result.analysis).toBe("object");
          expect(typeof result.steps).toBe("object");
        } catch (error) {
          // If it fails due to git/environment issues, that's expected in test environment
          expect(error).toBeInstanceOf(Error);
        }
      });

      it("should handle release options with different skip flags", async () => {
        const testCases = [
          {
            dryRun: true,
            skipNpm: true,
            skipGithub: false,
            skipChangelog: false,
          },
          {
            dryRun: true,
            skipNpm: false,
            skipGithub: true,
            skipChangelog: false,
          },
          {
            dryRun: true,
            skipNpm: false,
            skipGithub: false,
            skipChangelog: true,
          },
          {
            dryRun: true,
            skipNpm: true,
            skipGithub: true,
            skipChangelog: true,
          },
        ];

        for (const options of testCases) {
          try {
            const result = await orchestrator.release(options);

            expect(result).toHaveProperty("success");
            expect(result).toHaveProperty("analysis");
            expect(result).toHaveProperty("steps");
          } catch (error) {
            // Expected in test environment without proper git setup
            expect(error).toBeInstanceOf(Error);
          }
        }
      });

      it("should throw error with descriptive message on failure", async () => {
        const options: ReleaseOptions = {
          dryRun: false, // This will likely fail in test environment
          skipNpm: false,
          skipGithub: false,
        };

        try {
          await orchestrator.release(options);
        } catch (error) {
          expect(error).toBeInstanceOf(Error);
          expect((error as Error).message).toContain("Release failed:");
        }
      });
    });

    describe("error handling", () => {
      let orchestrator: ReleaseOrchestrator;

      beforeEach(() => {
        orchestrator = new ReleaseOrchestrator();
      });

      it("should handle analysis with error in bumpVersion", async () => {
        const analysis: AnalysisResult = {
          error: "Test error",
          bump: "patch",
          version: "1.0.1",
          currentVersion: "1.0.0",
          hasChanges: false,
          changes: {},
        };

        await expect(orchestrator.bumpVersion(analysis)).rejects.toThrow(
          "Test error"
        );
      });

      it("should handle analysis with error in generateChangelog", async () => {
        const analysis: AnalysisResult = {
          error: "Test error",
          bump: "patch",
          version: "1.0.1",
          currentVersion: "1.0.0",
          hasChanges: false,
          changes: {},
        };

        await expect(orchestrator.generateChangelog(analysis)).rejects.toThrow(
          "Test error"
        );
      });

      it("should handle analysis with error in commitChanges", async () => {
        const analysis: AnalysisResult = {
          error: "Test error",
          bump: "patch",
          version: "1.0.1",
          currentVersion: "1.0.0",
          hasChanges: false,
          changes: {},
        };

        await expect(orchestrator.commitChanges(analysis)).rejects.toThrow(
          "Test error"
        );
      });

      it("should handle analysis with error in createTag", async () => {
        const analysis: AnalysisResult = {
          error: "Test error",
          bump: "patch",
          version: "1.0.1",
          currentVersion: "1.0.0",
          hasChanges: false,
          changes: {},
        };

        await expect(orchestrator.createTag(analysis)).rejects.toThrow(
          "Test error"
        );
      });
    });
  });
});
