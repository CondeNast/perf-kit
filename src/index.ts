import compare from "./commands/compare";
import help from "./commands/help";
import profile from "./commands/profile";
import unknown from "./commands/unknown";

export async function run<T>(
  ...testSuites: Array<{
    name: string;
    cases: T[];
    runner: (test: T) => void;
  }>
) {
  try {
    switch (process.argv[2]) {
      case "profile":
        await profile(process.argv.slice(3), testSuites);
        break;
      case "compare":
        await compare(process.argv.slice(3), testSuites);
        break;
      case "help":
        await help(process.argv.slice(3));
        break;
      default:
        await unknown(process.argv[2]);
        break;
    }
    process.exit();
  } catch (error) {
    throw new Error(error as string);
  }
}
