import { execSync } from "child_process";

// Shell execution utilities
export const exec = (cmd: string) => execSync(cmd, { encoding: "utf8" }).trim();

export const execQuiet = (cmd: string) => {
  try {
    return execSync(`${cmd} 2>/dev/null`, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
};
