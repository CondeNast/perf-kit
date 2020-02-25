import { levenshteinDistance } from "../lib/levenshtein-distance";

export default function(command: string) {
  let argv = [];

  // This script was run using npx
  if (process.argv[0].indexOf("npx") !== -1) {
    argv.push("npx");
    let parts = process.argv[0].split("/");
    argv.push(parts[parts.length - 1]);
  } else {
    argv.push("node");
  }

  // Get the relative filename for the command
  argv.push(`.${process.argv[1].replace(process.cwd(), "")}`);

  if (levenshteinDistance(command, "compare") < 3) {
    console.error(
      `\u001B[33mUnrecognized command "${command}", did you mean "compare"?`
    );
    argv.push("compare", ...process.argv.slice(3));
  } else if (levenshteinDistance(command, "help") < 3) {
    console.error(
      `\u001B[33mUnrecognized command "${command}", did you mean "help"?`
    );
    argv.push("help", ...process.argv.slice(3));
  } else if (levenshteinDistance(command, "profile") < 3) {
    console.error(
      `\u001B[33mUnrecognized command "${command}", did you mean "profile"?`
    );
    argv.push("profile", ...process.argv.slice(3));
  } else {
    console.error(
      `\u001B[33mUnrecognized command "${command}", see "help" for all commands.`
    );
    argv.push("help");
  }

  console.log(`${argv.join(" ")}\u001B[0m`);
}
