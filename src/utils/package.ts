import { readFileSync, writeFileSync } from "fs";
import type { PackageJson } from "../types.js";

// Package.json utilities
export const getPackageJson = (): PackageJson =>
  JSON.parse(readFileSync("package.json", "utf8"));

export const savePackageJson = (pkg: PackageJson) =>
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
