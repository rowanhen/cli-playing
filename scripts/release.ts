#!/usr/bin/env node

import { exec } from "./release-lib.js";
import type { AnalysisResult } from "./types.js";

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const skipNpm = args.includes("--skip-npm");
const skipGithub = args.includes("--skip-github");
const skipChangelog = args.includes("--skip-changelog");

async function main(): Promise<void> {
  console.log("🚀 Starting release process...");

  if (dryRun) {
    console.log("📋 Running in dry-run mode\n");
  }

  // Keep track of completed steps for rollback
  const completedSteps: string[] = [];
  let analysisData: AnalysisResult | undefined;

  try {
    // Step 1: Analyze commits
    console.log("1️⃣  Analyzing commits...");
    const analysis = exec("npx tsx scripts/analyze-commits.ts");
    analysisData = JSON.parse(analysis) as AnalysisResult;
    const { bump, version, hasChanges, currentVersion } = analysisData;
    console.log(`   Version bump: ${bump}`);
    console.log(`   New version: ${version}`);
    console.log(`   Has changelog changes: ${hasChanges}\n`);

    // Pass analysis data to subsequent scripts via environment variable
    process.env.RELEASE_ANALYSIS = analysis;

    // Step 2: Bump version
    console.log("2️⃣  Bumping version...");
    const bumpResult = exec(
      `npx tsx scripts/bump-version.ts ${dryRun ? "--dry-run" : ""}`
    );
    const bumpData = JSON.parse(bumpResult);
    if (!dryRun && bumpData.success) completedSteps.push("bump-version");
    console.log(
      `   ${
        dryRun ? "🔍 Would update" : "✅ Updated"
      } package.json to ${version}\n`
    );

    // Step 3: Generate changelog (if not skipped and has changes)
    if (!skipChangelog && hasChanges) {
      console.log("3️⃣  Generating changelog...");
      const changelogResult = exec(
        `npx tsx scripts/generate-changelog.ts ${dryRun ? "--dry-run" : ""}`
      );
      const changelogData = JSON.parse(changelogResult);
      if (!dryRun && changelogData.success && !changelogData.skipped)
        completedSteps.push("changelog");
      console.log(
        `   ${dryRun ? "🔍 Would update" : "✅ Updated"} CHANGELOG.md\n`
      );
    } else if (skipChangelog) {
      console.log("3️⃣  Skipping changelog generation (--skip-changelog)\n");
    } else {
      console.log("3️⃣  Skipping changelog (no visible changes)\n");
    }

    // Step 4: Commit changes
    console.log("4️⃣  Committing changes...");
    const commitResult = exec(
      `npx tsx scripts/commit-changes.ts ${dryRun ? "--dry-run" : ""}`
    );
    const commitData = JSON.parse(commitResult);
    if (!dryRun && commitData.success && !commitData.skipped)
      completedSteps.push("commit");
    console.log(`   ${dryRun ? "🔍 Would commit" : "✅ Committed"} changes\n`);

    // Step 5: Create git tag
    console.log("5️⃣  Creating git tag...");
    const tagResult = exec(
      `npx tsx scripts/create-tag.ts ${dryRun ? "--dry-run" : ""}`
    );
    const tagData = JSON.parse(tagResult);
    if (!dryRun && tagData.success) completedSteps.push("tag");
    console.log(
      `   ${dryRun ? "🔍 Would create" : "✅ Created"} tag v${version}\n`
    );

    // Step 6: Publish to NPM (if not skipped)
    if (!skipNpm) {
      console.log("6️⃣  Publishing to NPM...");
      const npmResult = exec(
        `npx tsx scripts/publish-npm.ts ${dryRun ? "--dry-run" : ""}`
      );
      const npmData = JSON.parse(npmResult);
      if (!dryRun && npmData.success) completedSteps.push("npm");
      console.log(
        `   ${dryRun ? "🔍 Would publish" : "✅ Published"} to NPM\n`
      );
    } else {
      console.log("6️⃣  Skipping NPM publish (--skip-npm)\n");
    }

    // Step 7: Create GitHub release (if not skipped)
    if (!skipGithub) {
      console.log("7️⃣  Creating GitHub release...");
      const ghResult = await exec(
        `npx tsx scripts/create-github-release.ts ${dryRun ? "--dry-run" : ""}`
      );
      const ghData = JSON.parse(ghResult);
      if (!dryRun && ghData.success) completedSteps.push("github-release");
      console.log(
        `   ${dryRun ? "🔍 Would create" : "✅ Created"} GitHub release\n`
      );
    } else {
      console.log("7️⃣  Skipping GitHub release (--skip-github)\n");
    }

    // Push everything (if not dry-run)
    if (!dryRun) {
      console.log("🏁 Pushing changes...");
      exec("git push origin HEAD --follow-tags");
      console.log("   ✅ Pushed commits and tags\n");
    } else {
      console.log("🏁 Would push changes to git\n");
    }

    console.log(
      `🎉 ${
        dryRun
          ? "Dry run completed successfully!"
          : `Successfully released version ${version}!`
      }`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Release failed:", errorMessage);

    if (!dryRun && completedSteps.length > 0) {
      console.error(
        "\n⚠️  Partial release detected. Completed steps:",
        completedSteps
      );
      console.error("\nTo recover:");

      if (completedSteps.includes("tag") && !completedSteps.includes("npm")) {
        console.error("- Tag was created but NPM publish failed");
        console.error(
          `- Fix the issue and run: npm publish --tag ${
            analysisData?.isPrerelease ? "next" : "latest"
          }`
        );
      }

      if (
        completedSteps.includes("npm") &&
        !completedSteps.includes("github-release")
      ) {
        console.error("- NPM was published but GitHub release failed");
        console.error(
          "- Fix the issue and run: npx tsx scripts/create-github-release.ts"
        );
        console.error(
          `- You may need to set RELEASE_ANALYSIS='${JSON.stringify(
            analysisData
          )}'`
        );
      }

      if (
        completedSteps.includes("commit") &&
        !completedSteps.includes("tag")
      ) {
        console.error("- Changes were committed but tag creation failed");
        console.error("- Fix the issue and run: npx tsx scripts/create-tag.ts");
        console.error(
          `- You may need to set RELEASE_ANALYSIS='${JSON.stringify(
            analysisData
          )}'`
        );
      }
    }

    process.exit(1);
  }
}

main();
