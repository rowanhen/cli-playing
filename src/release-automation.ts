import { existsSync, readFileSync, writeFileSync } from "fs";
import {
  analyzeCommits,
  bumpVersion,
  CONFIG as defaultConfig,
  exec,
  formatChangelogEntry,
  formatReleaseNotes,
  getCommitsSinceLastTag,
  getCurrentBranch,
  getPackageJson,
  getPrereleaseTag,
  isBranchAllowed,
  savePackageJson,
} from "./release-lib.js";
import type {
  AnalysisResult,
  Config,
  ReleaseOptions,
  ReleaseStepResult,
} from "./types.js";

export class ReleaseAutomation {
  private config: Config;

  constructor(config?: Partial<Config>) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Analyze commits and determine what kind of release should be made
   */
  async analyzeCommits(): Promise<AnalysisResult> {
    try {
      // Get current package version
      const pkg = getPackageJson();
      const currentVersion = pkg.version;

      // Check if we're on an allowed branch
      const currentBranch = getCurrentBranch();
      if (!isBranchAllowed(currentBranch)) {
        return {
          error: `Branch '${currentBranch}' is not allowed for releases. Use 'main' or feature/fix/chore branches.`,
          bump: "patch",
          version: currentVersion,
          currentVersion,
          hasChanges: false,
          changes: {},
        };
      }

      // Get commits since last tag
      const commits = getCommitsSinceLastTag();
      if (commits.length === 0) {
        return {
          error: "No commits found since last tag",
          bump: "patch",
          version: currentVersion,
          currentVersion,
          hasChanges: false,
          changes: {},
        };
      }

      // Analyze commits
      const analysis = analyzeCommits(commits);

      // Determine if this is a prerelease
      const prereleaseTag = getPrereleaseTag(currentBranch);
      const isPrerelease = !!prereleaseTag;

      // Calculate new version
      const newVersion = bumpVersion(
        currentVersion,
        analysis.bump,
        prereleaseTag
      );

      // Determine if there are visible changes
      const hasChanges = Object.keys(analysis.changes).length > 0;

      // Extract commit subjects for detailed output
      const commitSubjects = commits
        .map((commit) => {
          const lines = commit.trim().split("\n");
          return lines[0] || "";
        })
        .filter((subject) => subject.trim());

      return {
        bump: analysis.bump,
        version: newVersion,
        currentVersion,
        hasChanges,
        isPrerelease,
        changes: analysis.changes,
        hasOnlyHiddenChanges: analysis.hasOnlyHiddenChanges,
        packageName: pkg.name,
        branch: currentBranch,
        commitCount: commits.length,
        commitSubjects,
        prereleaseTag,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        error: errorMessage,
        bump: "patch",
        version: "0.0.0",
        currentVersion: "0.0.0",
        hasChanges: false,
        changes: {},
      };
    }
  }

  /**
   * Bump the version in package.json
   */
  async bumpVersion(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    if (analysis.error) {
      throw new Error(analysis.error);
    }

    const pkg = getPackageJson();
    const oldVersion = pkg.version;

    if (!dryRun) {
      pkg.version = analysis.version;
      savePackageJson(pkg);
    }

    return {
      success: true,
      dryRun,
      oldVersion,
      newVersion: analysis.version,
    };
  }

  /**
   * Generate changelog entry
   */
  async generateChangelog(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    if (analysis.error) {
      throw new Error(analysis.error);
    }

    if (!analysis.hasChanges) {
      return {
        success: true,
        dryRun,
        skipped: true,
        reason: "No visible changes to document",
      };
    }

    // Read existing changelog or create new one
    let changelog =
      "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
    if (existsSync("CHANGELOG.md")) {
      changelog = readFileSync("CHANGELOG.md", "utf8");
    }

    // Generate new entry
    const newEntry = formatChangelogEntry(analysis.version, analysis.changes);

    // Insert new entry after header
    const lines = changelog.split("\n");
    let insertIndex = 2;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i]?.startsWith("## [")) {
        insertIndex = i;
        break;
      }
    }

    lines.splice(insertIndex, 0, newEntry.trim());

    if (!dryRun) {
      writeFileSync("CHANGELOG.md", lines.join("\n"));
    }

    return {
      success: true,
      dryRun,
      version: analysis.version,
      sections: Object.keys(analysis.changes),
      changelogEntry: newEntry.trim(),
      changelogPreview: dryRun
        ? lines.slice(0, Math.min(20, lines.length)).join("\n")
        : undefined,
    };
  }

  /**
   * Commit changes to git
   */
  async commitChanges(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    if (analysis.error) {
      throw new Error(analysis.error);
    }

    const message = `chore(release): ${analysis.version} [skip ci]`;
    const filesToCommit = ["package.json"];

    // Add changelog if it exists and has changes
    if (analysis.hasChanges && existsSync("CHANGELOG.md")) {
      filesToCommit.push("CHANGELOG.md");
    }

    // Add package-lock.json if it exists
    if (existsSync("package-lock.json")) {
      filesToCommit.push("package-lock.json");
    }

    if (!dryRun) {
      // Stage files
      for (const file of filesToCommit) {
        if (existsSync(file)) {
          exec(`git add ${file}`);
        }
      }

      // Commit
      exec(`git commit -m "${message}"`);
    }

    return {
      success: true,
      dryRun,
      message,
      files: filesToCommit,
    };
  }

  /**
   * Create git tag
   */
  async createTag(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    if (analysis.error) {
      throw new Error(analysis.error);
    }

    const tag = `v${analysis.version}`;
    const tagMessage = `Release ${analysis.version}`;

    if (!dryRun) {
      exec(`git tag -a ${tag} -m "${tagMessage}"`);
    }

    return {
      success: true,
      dryRun,
      tag,
      version: analysis.version,
      tagMessage,
      gitCommand: `git tag -a ${tag} -m "${tagMessage}"`,
      isPrerelease: analysis.isPrerelease || false,
    };
  }

  /**
   * Publish to NPM
   */
  async publishNpm(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    if (analysis.error) {
      throw new Error(analysis.error);
    }

    const pkg = getPackageJson();
    const npmTag = analysis.isPrerelease ? "next" : "latest";

    if (!dryRun) {
      // Check for NPM token
      if (!process.env.NODE_AUTH_TOKEN && !process.env.NPM_TOKEN) {
        throw new Error(
          "NPM authentication token not found. Set NODE_AUTH_TOKEN or NPM_TOKEN environment variable."
        );
      }

      exec(`npm publish --tag ${npmTag}`);
    }

    // Get package info for output
    const publishInfo = exec("npm pack --dry-run --json");
    const packInfo = JSON.parse(publishInfo);

    return {
      success: true,
      dryRun,
      version: analysis.version,
      tag: npmTag,
      packageName: pkg.name,
      fullPackageName: `${pkg.name}@${analysis.version}`,
      registry: "https://registry.npmjs.org",
      description: pkg.description || "",
      files: packInfo[0]?.files?.length || "unknown",
      size: packInfo[0]?.size || "unknown",
      publishCommand: `npm publish --tag ${npmTag}`,
    };
  }

  /**
   * Create GitHub release
   */
  async createGithubRelease(
    analysis: AnalysisResult,
    dryRun = false
  ): Promise<ReleaseStepResult> {
    if (analysis.error) {
      throw new Error(analysis.error);
    }

    const tag = `v${analysis.version}`;
    const releaseNotes = formatReleaseNotes(analysis.changes);

    if (!dryRun) {
      if (!process.env.GITHUB_TOKEN) {
        throw new Error(
          "GITHUB_TOKEN environment variable is required for GitHub releases"
        );
      }

      const repository = process.env.GITHUB_REPOSITORY;
      if (!repository) {
        throw new Error("GITHUB_REPOSITORY environment variable is required");
      }

      const releaseData = {
        tag_name: tag,
        name: tag,
        body: releaseNotes,
        prerelease: analysis.isPrerelease || false,
      };

      const response = await fetch(
        `https://api.github.com/repos/${repository}/releases`,
        {
          method: "POST",
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(releaseData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      const release = await response.json();
      return {
        success: true,
        dryRun,
        version: analysis.version,
        tag,
        url: release.html_url,
        releaseNotes,
      };
    }

    return {
      success: true,
      dryRun,
      version: analysis.version,
      tag,
      name: tag,
      prerelease: analysis.isPrerelease || false,
      releaseNotes,
      repository: process.env.GITHUB_REPOSITORY || "unknown",
    };
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
      if (!skipNpm) {
        steps.publishNpm = await this.publishNpm(analysis, dryRun);
      }

      // Step 7: Create GitHub release
      if (!skipGithub) {
        steps.createGithubRelease = await this.createGithubRelease(
          analysis,
          dryRun
        );
      }

      // Step 8: Push changes
      if (!dryRun) {
        exec("git push origin HEAD --follow-tags");
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
