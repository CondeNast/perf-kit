import { Box, Color, Text } from "ink";
import Table from "ink-table";
import { join, relative } from "path";
import * as React from "react";
import { FC, useEffect, useState } from "react";
import { useTask } from "../hooks";
import { generateTStats, FunctionTStat } from "../lib/generate-tstats";

const packagePath = /([^\/]+)\/dist\/commonjs\/(.*)$/;

function formatUrl(url: string) {
  let matches = url.match(packagePath);
  if (!matches) return url.slice(url.indexOf("@atjson"));

  return `${matches[1]} ${matches[2]}`;
}

function formatConfidenceInterval([start, end]: [number, number]) {
  return `${Math.round(start)}, ${Math.round(end)}`;
}

function toTableData(functionTStat: FunctionTStat) {
  return {
    name: functionTStat.functionName,
    location: formatUrl(functionTStat.url),
    before: Math.round(functionTStat.before.cumulativeTime.mean),
    after: Math.round(functionTStat.after.cumulativeTime.mean),
    confidence: formatConfidenceInterval(
      functionTStat.cumulativeTimeTStat.confidenceInterval
    )
  };
}

export const TStat: FC<{
  name: string;
  baseline: string;
  current: string;
  done: () => void;
  directory: string;
}> = props => {
  const [testDir] = useState(join(props.directory, props.name));
  const [relativePath] = useState(
    relative(join(__dirname, "../../.."), testDir)
  );

  const [{ isRunning, completed }, runStats] = useTask(
    function*() {
      yield generateTStats(testDir, props.baseline, props.current).then(
        ({ filename, profileTStat }) => {
          return {
            filename,
            functionTStats: profileTStat.functionTStats.map(toTableData)
          };
        }
      );
    },
    { strategy: "queue", maxConcurrency: 1 }
  );

  useEffect(() => {
    runStats();
  }, [props.directory, props.name, props.baseline, props.current]);

  const isFinished = !isRunning;
  const { functionTStats, filename } =
    (completed[0] && completed[0].value) || {};

  if (isFinished) {
    setTimeout(() => {
      props.done();
    }, 10);
  }

  return (
    <Box flexDirection="column">
      <Box>
        {isFinished && (
          <>
            <Color bgKeyword="green">
              <Text bold> DONE </Text>
            </Color>{" "}
            Comparing {props.name}: {props.current} against {props.baseline}
          </>
        )}
        {isRunning && (
          <>
            <Color black bgKeyword="yellow">
              <Text bold> RUNNING </Text>
            </Color>{" "}
            Comparing {props.name}: {props.current} against {props.baseline}
          </>
        )}
      </Box>
      {isFinished && (
        <Box flexDirection="column">
          <Color hex="#8B8B8B">
            {relativePath}/{props.current}/{filename}
          </Color>
          <Table data={functionTStats} />
        </Box>
      )}
    </Box>
  );
};
