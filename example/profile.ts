import { run } from "../src";

run({
  name: "test-suite",
  cases: ["one", "two", "three"],
  runner(testCase) {
    typeof testCase === "string"
  }
});
