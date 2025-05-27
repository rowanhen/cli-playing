import { writeFileSync } from "fs";
import { homedir } from "os";
import type { AnalysisResult, ReleaseStepResult } from "../types.js";
import { getPackageJson } from "../utils/package.js";
import { exec } from "../utils/shell.js";

/**
 * Publish to NPM
 */
export async function publishNpm(
  analysis: AnalysisResult,
  dryRun = false,
  skipAuth = false
): Promise<ReleaseStepResult> {
  if (analysis.error) {
    throw new Error(analysis.error);
  }

  const pkg = getPackageJson();
  const npmTag = analysis.isPrerelease ? "next" : "latest";

  // Skip authentication checks if skipAuth is true and we're in dry-run mode
  let authValidation = { valid: false, username: "", error: "" };

  if (!skipAuth) {
    // Check for NPM token (both in dry-run and real run)
    if (!process.env.NPM_TOKEN) {
      throw new Error(
        "NPM authentication token not found. Set NPM_TOKEN environment variable."
      );
    }

    // Setup NPM authentication (like semantic-release does)
    if (!dryRun) {
      const npmrcPath = homedir() + "/.npmrc";
      const npmrcContent = `//registry.npmjs.org/:_authToken=${process.env.NPM_TOKEN}`;
      writeFileSync(npmrcPath, npmrcContent);
    }

    // Check if version already exists on NPM (for both dry-run and real run)
    try {
      const viewResult = exec(
        `npm view ${pkg.name}@${analysis.version} version`
      );
      if (viewResult.trim() === analysis.version) {
        throw new Error(
          `Version ${analysis.version} of ${pkg.name} already exists on NPM. Cannot publish duplicate version.`
        );
      }
    } catch (error) {
      // If npm view fails, it likely means the version doesn't exist (which is good)
      // or there's a network/auth issue. We only care if it succeeds and returns the version.
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes("npm ERR! code E404")) {
        // E404 means version doesn't exist, which is what we want
        // Any other error might be concerning
        console.warn(
          `Warning: Could not check if version exists on NPM: ${errorMessage}`
        );
      }
    }

    // Note: We don't check organization access here because:
    // 1. It requires admin permissions which most users don't have
    // 2. The actual publish command will fail if permissions are insufficient
    // 3. This avoids false negatives for users with publish but not admin rights
  } else if (dryRun) {
    // In dry-run with skipAuth, mark as skipped
    authValidation = {
      valid: false,
      username: "",
      error: "Skipped (--skip-npm)",
    };
  }

  if (!dryRun) {
    // Use npm publish with explicit tag
    exec(`npm publish --tag ${npmTag}`);
  }

  // Get package info for output (this doesn't require auth)
  let packInfo: any[] = [];
  try {
    const publishInfo = exec("npm pack --dry-run --json");
    packInfo = JSON.parse(publishInfo);
  } catch (error) {
    // If npm pack fails (e.g., no auth), provide fallback info
    packInfo = [{ files: [], size: 0 }];
  }

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
    authValidation,
    skipped: skipAuth && dryRun,
    isScoped: pkg.name.startsWith("@"),
    scope: pkg.name.startsWith("@") ? pkg.name.split("/")[0] : undefined,
  };
}
