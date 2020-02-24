import {
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  writeFileSync
} from "fs";
import { join } from "path";
import { profile } from "./lib/profile";
import { generateTStats } from "./lib/generate-tstats";
import * as minimist from "minimist";

const directory = join(process.cwd(), "profiles");

function isPerformanceFile(name: string) {
  return (
    name.endsWith(".cpuprofile") ||
    name.endsWith("-tstats.json") ||
    name === "timing.json"
  );
}

function prepareDir(name: string, baseline: string) {
  let workingDir = join(directory, name, baseline);
  if (!existsSync(workingDir)) {
    mkdirSync(workingDir, { recursive: true });
  } else {
    let files = readdirSync(workingDir).filter(isPerformanceFile);

    for (const file of files) {
      unlinkSync(join(workingDir, file));
    }
  }
}

export async function run<T>(
  ...testSuites: Array<{
    name: string;
    cases: T[];
    runner: (test: T) => void;
  }>
) {
  try {
    switch (process.argv[2]) {
      case "profile": {
        let args = minimist(process.argv.slice(3), {
          alias: { v: "verbose" },
          boolean: ["verbose"],
          default: { verbose: false, times: 10, out: "baseline" }
        }) as {
          _: any[];
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
            filter: node => {
              if (args.target) {
                return node.url.indexOf(args.target) !== -1;
              } else {
                return node.url.indexOf("node_modules") === -1;
              }
            },
            directory
          });
        }
        break;
      }
      case "compare": {
        let args = minimist(process.argv.slice(3), {
          alias: { v: "verbose" },
          boolean: ["verbose"]
        }) as { _: any[]; verbose: boolean; out: string };

        let [baseline, current] = args._;
        let directory = join(process.cwd(), "perf-kit", "profiles");

        // let filter = args._ || testSuites.map(suite => suite.name);
        for (let testSuite of testSuites) {
          let result = await generateTStats(
            join(directory, testSuite.name),
            baseline,
            current
          );

          writeFileSync(
            join(directory, testSuite.name, current, result.filename),
            JSON.stringify(result.profileTStat)
          );

          if (args.verbose) {
            console.log(
              `Significance: ${(
                result.profileTStat.cumulativeTimeTStat.pValue * 100
              ).toFixed(2)}%`
            );
          }
        }
        break;
      }
      case "help":
      default:
        break;
    }
    process.exit();
  } catch (error) {
    throw new Error(error);
  }
}
