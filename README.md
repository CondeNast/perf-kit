# Perf Kit

Perf kit is a toolchain for testing performance regressions in JavaScript code. While writing [atjson](https://github.com/CondeNast/atjson), we created a set of tools for testing performance regressions in our code.

What resulted was this library that leverages the V8 profiler to collect metrics about the performance of our software that we could use to identify:

- If a proposed change to the codebase impacted performance significantly
- What, in particular, are performance bottlenecks for a piece of code

## Generating performance profiles

Performance test suites are defined in `performance/index.ts` and specify a number of test cases to be run by a `runner` function. Within a test suite, a test run will generate a .cpuprofile of the test runner acting on all of the test cases in a random order. To run the test suites, run `npm run perf` which by default will run each test suite 10 times and store the .cpuprofile files in `performance/profiles/{test suite name}/current`. It will additionally aggregate over the test runs to generate a `timing.json` file in the same directory. The timing file will have distribution data for the sample and cumulative times for each function sampled in the test runs. For now, only functions defined in packages in this repo are included in the tiing file.

Performance profile generation can be configured by including parameters to the npm script. Including a `--baseline` flag will store the output files in a `baseline` folder instead of `current`, or a different folder can be further specified if this is passed as an option. Additionally, the number of runs can be configured by including the `--times` option:

`npm run perf -- --baseline new-baseline-folder --times 20`

As a shortcut, `npm run perf:baseline` is equivalent to `npm run perf -- --baseline baseline --times 10`.

## Comparing performance profiles

Once performance profiles are generated, we can compare the results of one baseline against another by running `npm run perf-tstats` which will perform a Student's T-Test for every function timing collected over the test runs, as collected in the respective timing.json file in the baseline folder. In short, we consider the timing for every function to be its own random variable, and the timing recorded in each test run to be a sample. The T-Test asks whether the population of timings for a function of sampled in one baseline meaningfully differ from those sampled from a different one. If they are found to be different (ie, if the 95% confidence interval of their difference is entirely positive or negative), their T-Test results are included in a `{baseline1}-{baseline2}-tstat.json` file in the `baseline2` directory and their summary is output to the console. The output file will additionally include timing information for any added function calls sampled in `baseline2` but not `baseline1`, and any dropped function calls sampled in `baseline1` but missing from `baseline2`.

Comparison can be conifugred by included parameters to the npm script. A `--baseline` option can be included to specify the baseline to compare from, and a `--current` option can be included to specify the baseline to compare to. `npm run perf-tstats` is equivalent to `npm run perf-tstats -- --baseline baseline --current current`.
