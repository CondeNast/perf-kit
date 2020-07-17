import { readFileSync } from "fs";
import { join } from "path";

export default async function (argv: string[]) {
  switch (argv[0]) {
    case "compare":
      console.log(
        readFileSync(join(__dirname, "..", "help", "compare.txt")).toString()
      );
      break;
    case "profile":
      console.log(
        readFileSync(join(__dirname, "..", "help", "profile.txt")).toString()
      );
      break;
    default:
      console.log(
        readFileSync(join(__dirname, "..", "help", "help.txt")).toString()
      );
  }
}
