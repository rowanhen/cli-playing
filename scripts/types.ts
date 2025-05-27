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

export interface ReleaseStepResult {
  success: boolean;
  dryRun: boolean;
  skipped?: boolean;
  reason?: string;
  [key: string]: any;
}
