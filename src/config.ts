import type { Config } from "./types.js";

// Shared configuration
export const CONFIG: Config = {
  types: {
    feat: { bump: "minor", section: "Features" },
    fix: { bump: "patch", section: "Bug Fixes" },
    docs: { bump: "patch", section: "Documentation" },
    style: { bump: "patch", section: "Styles" },
    refactor: { bump: "patch", section: "Refactors" },
    perf: { bump: "patch", section: "Performance Improvements" },
    test: { bump: "patch", section: "Tests" },
    chore: { bump: "patch", section: "Chores" },
    // Hidden types - still trigger releases but don't appear in changelog
    bump: { bump: "patch", hidden: true },
    dependabot: { bump: "patch", hidden: true },
    revert: { bump: "patch", hidden: true },
  },
  // Scopes to hide for specific types
  hiddenScopes: {
    chore: ["npm-dep"],
  },
  // Breaking change keywords
  breakingKeywords: [
    "BREAKING CHANGE",
    "BREAKING-CHANGE",
    "BREAKING CHANGES",
    "BREAKING-CHANGES",
  ],
  // Branch configuration
  branches: {
    main: "main",
    prereleasePattern: /^(feature|fix|chore)\//,
    prereleasePrefix: "crumbs",
  },
};
