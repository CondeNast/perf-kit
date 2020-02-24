/* eslint-env node */
import * as crypto from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import * as inspector from "inspector";
import { join } from "path";
import { generateTiming, TimedFunction } from "../lib/generate-timing";

function shuffle<T>(items: T[]): T[] {
  // No more items to shuffle
  if (items.length < 2) {
    return items;
  }

  let number = Math.floor(Math.random() * items.length);
  let otherItems = [...items.slice(0, number), ...items.slice(number + 1)];

  return [items[number], ...shuffle(otherItems)];
}

function testId() {
  return crypto.randomBytes(16).toString("hex");
}

function enable(session: inspector.Session): Promise<void> {
  return new Promise((resolve, reject) => {
    session.connect();
    session.post("Profiler.enable", err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function disable(session: inspector.Session): Promise<void> {
  return new Promise((resolve, reject) => {
    session.post("Profiler.disable", err => {
      if (err) reject(err);
      else {
        session.disconnect();
        resolve();
      }
    });
  });
}

function run(
  session: inspector.Session,
  cases: any[],
  runner: (testCase: any) => void
): Promise<inspector.Profiler.Profile | undefined> {
  return new Promise((resolve, reject) => {
    session.post("Profiler.start", err => {
      if (err) {
        reject(err);
      } else {
        for (let i = 0, len = cases.length; i < len; i++) {
          runner(cases[i]);
        }
        session.post("Profiler.stop", (err, { profile }) => {
          if (err != null) reject(err);
          else resolve(profile);
        });
      }
    });
  });
}

function writeProfile(directory: string, profile: any, id: string) {
  if (profile) {
    writeFileSync(join(directory, `${id}.cpuprofile`), JSON.stringify(profile));
  }
  return id;
}

export function generateTestCases<T>(cases: T[], times: number) {
  let runs: { [key: string]: T[] } = {};

  while (times--) {
    let shuffledCases = shuffle(cases);
    runs[testId()] = shuffledCases;
  }
  return runs;
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
    .then(
      id => disable(session).then(() => id),
      () => disable(session)
    );
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
  let runs = generateTestCases(props.cases, props.runs);

  for (let testId in runs) {
    if (props.verbose) {
      console.log(`RUNNING ${props.name} ${testId}.cpuprofile`);
    }
    await generateCPUProfile(testId, runs[testId], workingDir, props.run);
  }

  await generateTiming(workingDir, props.filter);
}
