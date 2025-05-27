#!/usr/bin/env node

import { ReleaseAutomation } from "./release-automation.js";
import type { ReleaseOptions } from "./types.js";

async function main() {
  const args = process.argv.slice(2);

  // Check for help first
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: release-automation [command] [options]

Commands:
  release    Run the complete release process (default)
  analyze    Analyze commits and show what would be released

Options:
  --dry-run         Show what would be done without making changes
  --skip-npm        Skip NPM publishing
  --skip-github     Skip GitHub release creation
  --skip-changelog  Skip changelog generation

Examples:
  release-automation                    # Run full release
  release-automation --dry-run          # Preview what would be released
  release-automation analyze            # Just analyze commits
  release-automation --skip-npm         # Release without NPM publish
    `);
    return;
  }

  // Parse command line arguments
  const options: ReleaseOptions = {
    dryRun: args.includes("--dry-run"),
    skipNpm: args.includes("--skip-npm"),
    skipGithub: args.includes("--skip-github"),
    skipChangelog: args.includes("--skip-changelog"),
  };

  const command = args.find((arg) => !arg.startsWith("--")) || "release";

  try {
    const automation = new ReleaseAutomation();

    switch (command) {
      case "analyze":
        const analysis = await automation.analyzeCommits();
        console.log(JSON.stringify(analysis, null, 2));
        break;

      case "release":
        console.log("🚀 Starting release process...");
        if (options.dryRun) {
          console.log("📋 Running in dry-run mode\n");
        }

        const result = await automation.release(options);

        if (options.dryRun) {
          console.log("\n🎉 Dry run completed successfully!");
        } else {
          console.log("\n🎉 Release completed successfully!");
          console.log(`📦 Released version: ${result.analysis.version}`);
        }
        break;

      default:
        console.log(`Unknown command: ${command}`);
        console.log("Use --help for usage information");
        process.exit(1);
    }
  } catch (error) {
    console.error(
      "❌ Release failed:",
      error instanceof Error ? error.message : String(error)
    );
    process.exit(1);
  }
}

main();
