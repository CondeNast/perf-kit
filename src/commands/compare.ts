import { writeFileSync } from "fs";
import * as minimist from "minimist";
import { join } from "path";
import { generateTStats } from "../lib/generate-tstats";

export default async function<T>(
  argv: string[],
  testSuites: Array<{
    name: string;
    cases: T[];
    runner: (test: T) => void;
  }>
) {
  let args = minimist(argv, {
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
}
