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

        // First analyze to show what will happen
        const releaseAnalysis = await automation.analyzeCommits();
        if (releaseAnalysis.error) {
          throw new Error(releaseAnalysis.error);
        }

        // Show analysis details
        console.log("1️⃣  Analyzing commits...");
        console.log(`   Version bump: ${releaseAnalysis.bump}`);
        console.log(`   New version: ${releaseAnalysis.version}`);
        console.log(`   Has changelog changes: ${releaseAnalysis.hasChanges}`);
        console.log("");
        console.log(`   📦 Package: ${releaseAnalysis.packageName}`);
        console.log(`   🌿 Branch: ${releaseAnalysis.branch}`);
        console.log(`   📝 Commits analyzed: ${releaseAnalysis.commitCount}`);
        if (
          releaseAnalysis.commitSubjects &&
          releaseAnalysis.commitSubjects.length > 0
        ) {
          console.log("   📋 Commit messages:");
          releaseAnalysis.commitSubjects.forEach((subject, index) => {
            console.log(`      ${index + 1}. ${subject}`);
          });
        }
        console.log("");

        const result = await automation.release(options);

        // Show detailed step results
        let stepNumber = 2;

        if (result.steps.bumpVersion) {
          console.log(`${stepNumber}️⃣  Bumping version...`);
          if (options.dryRun) {
            console.log(
              `   🔍 Would update package.json to ${result.steps.bumpVersion.newVersion}`
            );
          } else {
            console.log(
              `   ✅ Updated package.json to ${result.steps.bumpVersion.newVersion}`
            );
          }
          console.log("");
          stepNumber++;
        }

        if (result.steps.generateChangelog) {
          console.log(`${stepNumber}️⃣  Generating changelog...`);
          if (options.dryRun) {
            console.log("   🔍 Would update CHANGELOG.md");
            if (result.steps.generateChangelog.changelogEntry) {
              console.log("");
              console.log("   📝 Changelog entry that would be added:");
              console.log(result.steps.generateChangelog.changelogEntry);
            }
          } else {
            console.log("   ✅ Updated CHANGELOG.md");
          }
          console.log("");
          stepNumber++;
        }

        if (result.steps.commitChanges) {
          console.log(`${stepNumber}️⃣  Committing changes...`);
          if (options.dryRun) {
            console.log("   🔍 Would commit changes");
            console.log(
              `   💬 Commit message: "${result.steps.commitChanges.message}"`
            );
            if (result.steps.commitChanges.files) {
              console.log(
                `   📁 Files to commit: ${result.steps.commitChanges.files.join(
                  ", "
                )}`
              );
            }
          } else {
            console.log("   ✅ Committed changes");
          }
          console.log("");
          stepNumber++;
        }

        if (result.steps.createTag) {
          console.log(`${stepNumber}️⃣  Creating git tag...`);
          if (options.dryRun) {
            console.log(`   🔍 Would create tag ${result.steps.createTag.tag}`);
            console.log(
              `   🏷️  Git command: ${result.steps.createTag.gitCommand}`
            );
            console.log(
              `   📝 Tag message: "${result.steps.createTag.tagMessage}"`
            );
          } else {
            console.log(`   ✅ Created tag ${result.steps.createTag.tag}`);
          }
          console.log("");
          stepNumber++;
        }

        if (result.steps.publishNpm) {
          console.log(`${stepNumber}️⃣  Publishing to NPM...`);
          if (options.dryRun) {
            console.log("   🔍 Would publish to NPM");
            console.log(
              `   📦 Package: ${result.steps.publishNpm.packageName}@${result.steps.publishNpm.version}`
            );
            console.log(`   🏷️  NPM tag: ${result.steps.publishNpm.tag}`);
            if (result.steps.publishNpm.registry) {
              console.log(
                `   🌐 Registry: ${result.steps.publishNpm.registry}`
              );
            }
            if (result.steps.publishNpm.description) {
              console.log(
                `   📄 Description: ${result.steps.publishNpm.description}`
              );
            }
            if (result.steps.publishNpm.files) {
              console.log(
                `   📁 Files: ${result.steps.publishNpm.files} files`
              );
            }
            if (result.steps.publishNpm.size) {
              console.log(`   📊 Size: ${result.steps.publishNpm.size} bytes`);
            }
            if (result.steps.publishNpm.publishCommand) {
              console.log(
                `   🚀 Command: ${result.steps.publishNpm.publishCommand}`
              );
            }
          } else {
            console.log(
              `   ✅ Published to NPM: ${result.steps.publishNpm.packageName}@${result.steps.publishNpm.version}`
            );
          }
          console.log("");
          stepNumber++;
        }

        if (result.steps.createGithubRelease) {
          console.log(`${stepNumber}️⃣  Creating GitHub release...`);
          if (options.dryRun) {
            console.log("   🔍 Would create GitHub release");
            console.log(
              `   🏷️  Release tag: ${result.steps.createGithubRelease.tag}`
            );
            if (result.steps.createGithubRelease.repository) {
              console.log(
                `   📦 Repository: ${result.steps.createGithubRelease.repository}`
              );
            }
            if (result.steps.createGithubRelease.releaseNotes) {
              console.log("");
              console.log("   📝 Release notes that would be created:");
              console.log(result.steps.createGithubRelease.releaseNotes);
            }
          } else {
            console.log(
              `   ✅ Created GitHub release: ${result.steps.createGithubRelease.tag}`
            );
          }
          console.log("");
          stepNumber++;
        }

        if (options.dryRun) {
          console.log("🏁 Would push changes to git");
          console.log("");
          console.log("🎉 Dry run completed successfully!");
        } else {
          console.log("🏁 Pushed changes to git");
          console.log("");
          console.log("🎉 Release completed successfully!");
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
