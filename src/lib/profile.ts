/* eslint-env node */
import * as crypto from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as inspector from "inspector";
import { join } from "path";
import { generateTiming, TimedFunction } from "../lib/generate-timing";
import { shuffle } from "./shuffle";
import { enable, disable, run } from "./node-profiler";

function writeProfile(directory: string, profile: any, id: string) {
  if (profile) {
    writeFileSync(join(directory, `${id}.cpuprofile`), JSON.stringify(profile));
  }
  return id;
}

export function generateCPUProfile<T>(
  id: string,
  cases: T[],
  directory: string,
  runner: (testCase: T) => void
) {
  if (!existsSync(directory)) {
    mkdirSync(directory, { recursive: true });
  }

  let session = new inspector.Session();
  return enable(session)
    .then(() => run(session, cases, runner))
    .then(profile => writeProfile(directory, profile, id))
    .finally(() => disable(session));
}

export async function profile<T>(props: {
  name: string;
  cases: T[];
  run: (testCase: T) => void;
  directory: string;
  runs: number;
  out: string;
  filter: (node: TimedFunction) => boolean;
  verbose: boolean;
}) {
  let workingDir = join(props.directory, props.name, props.out);
  let runs: { [key: string]: T[] } = {};

  for (let i = 0; i < props.runs; i++) {
    let shuffledCases = shuffle(props.cases);
    let testId = crypto.randomBytes(16).toString("hex");
    runs[testId] = shuffledCases;
  }

  for (let testId in runs) {
    if (props.verbose) {
      console.log(`RUNNING ${props.name} ${testId}.cpuprofile`);
    }
    await generateCPUProfile(testId, runs[testId], workingDir, props.run);
  }

  await generateTiming(workingDir, props.filter);
}
