import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import * as ttest from "ttest";
import { FunctionTiming, ProfileStat, TimingStat } from "./generate-timing";

export type TStat = {
  confidenceInterval: [number, number];
  tScore: number;
  pValue: number;
  degreesFreedom: number;
  alpha: number;
};

export type FunctionTStat = {
  functionName: string;
  url: string;
  before: FunctionTiming;
  after: FunctionTiming;
  cumulativeTimeTStat: TStat;
};

export type ProfileTStat = {
  cumulativeTimeTStat: TStat;
  functionTStats: FunctionTStat[];
  dropped: FunctionTiming[];
  added: FunctionTiming[];
};

function compareFunctionTStats(
  functionTStat1: FunctionTStat,
  functionTStat2: FunctionTStat
) {
  return (
    Math.abs(functionTStat2.cumulativeTimeTStat.confidenceInterval[0]) -
    Math.abs(functionTStat1.cumulativeTimeTStat.confidenceInterval[0])
  );
}

function hasMeaningfulDifference({ confidenceInterval }: TStat) {
  let [min, max] = confidenceInterval;
  return (min < 0 && max < 0) || (0 < min && max < 0);
}

function getTStat(
  stat1: TimingStat,
  stat2: TimingStat,
  alpha: number = 0.05
): TStat {
  let ttestStats = ttest(stat2.data, stat1.data, { alpha });
  return {
    confidenceInterval: ttestStats.confidence(),
    tScore: ttestStats.testValue(),
    pValue: ttestStats.pValue(),
    degreesFreedom: ttestStats.freedom(),
    alpha
  };
}

function toKey(functionInfo: { url: string; functionName: string }) {
  return `${functionInfo.url}, ${functionInfo.functionName}`;
}

function getTStats(
  profileStat1: ProfileStat,
  profileStat2: ProfileStat
): ProfileTStat {
  let functionMap = new Map<string, [FunctionTiming?, FunctionTiming?]>();
  [profileStat1.functions, profileStat2.functions].forEach(
    (functionTimings, index) => {
      functionTimings.forEach(functionTiming => {
        let key = toKey(functionTiming);
        let entry = functionMap.get(key);
        if (!entry) {
          entry = [];
          functionMap.set(key, entry);
        }

        entry[index] = functionTiming;
      });
    }
  );

  let functionTStats: FunctionTStat[] = [];
  let dropped: FunctionTiming[] = [];
  let added: FunctionTiming[] = [];
  functionMap.forEach(([functionTiming1, functionTiming2]) => {
    if (!functionTiming1) {
      added.push(functionTiming2!);
    } else if (!functionTiming2) {
      dropped.push(functionTiming1!);
    } else {
      try {
        let tStat = getTStat(
          functionTiming1.cumulativeTime,
          functionTiming2.cumulativeTime
        );
        if (hasMeaningfulDifference(tStat)) {
          functionTStats.push({
            functionName: functionTiming1.functionName,
            url: functionTiming1.url,
            before: functionTiming1,
            after: functionTiming2,
            cumulativeTimeTStat: tStat
          });
        }
      } catch {}
    }
  });

  functionTStats.sort(compareFunctionTStats);
  return {
    cumulativeTimeTStat: getTStat(
      profileStat1.cumulativeTime,
      profileStat2.cumulativeTime
    ),
    functionTStats,
    dropped,
    added
  };
}

export function generateTStats(
  testDir: string,
  baseline: string,
  current: string
) {
  return new Promise<{ filename: string; profileTStat: ProfileTStat }>(
    (resolve, reject) => {
      try {
        let beforeProfileStat = JSON.parse(
          readFileSync(join(testDir, baseline, "timing.json")).toString()
        ) as ProfileStat;
        let profileStat = JSON.parse(
          readFileSync(join(testDir, current, "timing.json")).toString()
        ) as ProfileStat;
        let profileTStat = getTStats(beforeProfileStat, profileStat);
        let filename = `${baseline}-${current}-tStats.json`;
        writeFileSync(
          join(testDir, current, filename),
          JSON.stringify(profileTStat)
        );
        resolve({ filename, profileTStat });
      } catch (error) {
        reject(error);
      }
    }
  );
}
