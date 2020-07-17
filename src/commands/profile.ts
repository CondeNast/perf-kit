import { existsSync, mkdirSync, readdirSync, unlinkSync } from "fs";
import minimist from "minimist";
import { join } from "path";
import { profile } from "../lib/profile";

function isPerformanceFile(name: string) {
  return (
    name.endsWith(".cpuprofile") ||
    name.endsWith("-tstats.json") ||
    name === "timing.json"
  );
}

function prepareDir(name: string, baseline: string) {
  let workingDir = join(process.cwd(), "profiles", name, baseline);
  if (!existsSync(workingDir)) {
    mkdirSync(workingDir, { recursive: true });
  } else {
    let files = readdirSync(workingDir).filter(isPerformanceFile);

    for (const file of files) {
      unlinkSync(join(workingDir, file));
    }
  }
}

export default async function <T>(
  argv: string[],
  testSuites: Array<{
    name: string;
    cases: T[];
    runner: (test: T) => void;
  }>
) {
  let args = minimist(argv, {
    alias: { v: "verbose" },
    boolean: ["verbose"],
    default: { verbose: false, times: 10, out: "baseline" },
  }) as {
    _: unknown[];
    verbose: boolean;
    times: string;
    out: string;
    target?: string;
  };

  let directory = join(process.cwd(), "perf-kit", "profiles");

  // let filter = args._ || testSuites.map(suite => suite.name);
  for (let testSuite of testSuites) {
    prepareDir(testSuite.name, args.out);
    await profile<T>({
      name: testSuite.name,
      cases: testSuite.cases,
      run: testSuite.runner,
      verbose: args.verbose,
      runs: Number(args.times),
      out: args.out,
      filter: (node) => {
        if (args.target) {
          return node.url.indexOf(args.target) !== -1;
        } else {
          return node.url.indexOf("node_modules") === -1;
        }
      },
      directory,
    });
  }
}
