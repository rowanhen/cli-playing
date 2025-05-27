import { CONFIG as defaultConfig } from "../release-lib.js";
import type {
  AnalysisResult,
  Config,
  ReleaseOptions,
  ReleaseStepResult,
} from "../types.js";
import { generateChangelog } from "./changelog-generator.js";
import { commitChanges, createTag, pushChanges } from "./git-operations.js";
import { createGithubRelease } from "./github-release.js";
import { publishNpm } from "./npm-publisher.js";
import {
  analyzeCommitsForRelease,
  bumpPackageVersion,
} from "./version-manager.js";

export class ReleaseOrchestrator {
  private config: Config;

  constructor(config?: Partial<Config>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Analyze commits and determine what kind of release should be made
   */
  async analyzeCommits(): Promise<AnalysisResult> {
    return analyzeCommitsForRelease();
  }

  /**
   * Bump the version in package.json
   */
  async bumpVersion(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    return bumpPackageVersion(analysis, dryRun);
  }

  /**
   * Generate changelog entry
   */
  async generateChangelog(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    return generateChangelog(analysis, dryRun);
  }

  /**
   * Commit changes to git
   */
  async commitChanges(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    return commitChanges(analysis, dryRun);
  }

  /**
   * Create git tag
   */
  async createTag(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    return createTag(analysis, dryRun);
  }

  /**
   * Publish to NPM
   */
  async publishNpm(
    analysis: AnalysisResult,
    dryRun = false,
    skipAuth = false
  ): Promise<ReleaseStepResult> {
    return publishNpm(analysis, dryRun, skipAuth);
  }

  /**
   * Create GitHub release
   */
  async createGithubRelease(
    analysis: AnalysisResult,
    dryRun = false,
    skipAuth = false
  ): Promise<ReleaseStepResult> {
    return createGithubRelease(analysis, dryRun, skipAuth);
  }

  /**
   * Run the complete release process
   */
  async release(options: ReleaseOptions = {}): Promise<{
    success: boolean;
    analysis: AnalysisResult;
    steps: Record<string, ReleaseStepResult>;
  }> {
    const {
      dryRun = false,
      skipNpm = false,
      skipGithub = false,
      skipChangelog = false,
    } = options;

    const steps: Record<string, ReleaseStepResult> = {};

    try {
      // Step 1: Analyze commits
      const analysis = await this.analyzeCommits();
      if (analysis.error) {
        throw new Error(analysis.error);
      }

      // Step 2: Bump version
      steps.bumpVersion = await this.bumpVersion(analysis, dryRun);

      // Step 3: Generate changelog
      if (!skipChangelog && analysis.hasChanges) {
        steps.generateChangelog = await this.generateChangelog(
          analysis,
          dryRun
        );
      }

      // Step 4: Commit changes
      steps.commitChanges = await this.commitChanges(analysis, dryRun);

      // Step 5: Create tag
      steps.createTag = await this.createTag(analysis, dryRun);

      // Step 6: Publish to NPM
      steps.publishNpm = await this.publishNpm(analysis, dryRun, skipNpm);

      // Step 7: Create GitHub release
      if (!skipGithub) {
        steps.createGithubRelease = await this.createGithubRelease(
          analysis,
          dryRun,
          skipGithub
        );
      }

      // Step 8: Push changes
      if (!dryRun) {
        pushChanges(dryRun);
      }

      return {
        success: true,
        analysis,
        steps,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Release failed: ${errorMessage}`);
    }
  }
}
