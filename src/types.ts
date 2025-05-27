// Shared TypeScript interfaces for release scripts

export interface CommitTypeConfig {
  bump: "major" | "minor" | "patch";
  section?: string;
  hidden?: boolean;
}

export interface Config {
  types: Record<string, CommitTypeConfig>;
  hiddenScopes: Record<string, string[]>;
  breakingKeywords: string[];
  branches: {
    main: string;
    prereleasePattern: RegExp;
    prereleasePrefix: string;
  };
}

export interface ParsedCommit {
  type: string;
  scope?: string;
  description: string;
  breaking: boolean;
  body: string;
}

export interface CommitAnalysisResult {
  bump: "major" | "minor" | "patch";
  changes: Record<string, string[]>;
  hasOnlyHiddenChanges: boolean;
}

export interface AnalysisResult {
  error?: string;
  bump: "major" | "minor" | "patch";
  version: string;
  currentVersion: string;
  hasChanges: boolean;
  isPrerelease?: boolean;
  changes: Record<string, string[]>;
  hasOnlyHiddenChanges?: boolean;
  // Additional fields for detailed dry-run output
  packageName?: string;
  branch?: string;
  commitCount?: number;
  commitSubjects?: string[];
  prereleaseTag?: string | null;
}

export interface PackageJson {
  name: string;
  version: string;
  [key: string]: any;
}

export interface PackInfo {
  files?: { length: number };
  size?: number;
}

export interface GitHubRelease {
  html_url: string;
  id: number;
}

export interface ReleaseOptions {
  dryRun?: boolean;
  skipNpm?: boolean;
  skipGithub?: boolean;
  skipChangelog?: boolean;
  config?: Partial<Config>;
}

export interface ReleaseStepResult {
  success: boolean;
  dryRun?: boolean;
  skipped?: boolean;
  reason?: string;
  error?: string;
  // Version-related fields
  oldVersion?: string;
  newVersion?: string;
  version?: string;
  // Changelog fields
  sections?: string[];
  changelogEntry?: string;
  changelogPreview?: string;
  // Commit fields
  message?: string;
  files?: string[];
  // Tag fields
  tag?: string;
  tagMessage?: string;
  gitCommand?: string;
  isPrerelease?: boolean;
  wouldCreate?: boolean;
  alreadyExists?: boolean;
  // NPM fields
  packageName?: string;
  fullPackageName?: string;
  registry?: string;
  description?: string;
  publishCommand?: string;
  // GitHub fields
  name?: string;
  prerelease?: boolean;
  releaseNotes?: string;
  repository?: string;
  url?: string;
  // Generic fields
  [key: string]: any;
}
