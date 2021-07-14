const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
import { markdownTable } from "markdown-table";

class TimeUnit {
  value: number;
  valueWithUnit: string;
  units = {
    0: { unitScale: "s" },
    3: { unitScale: "ms" },
    6: { unitScale: "us" },
  };

  convert(n: number): string {
    const numberString = n.toString();
    const numberLen = numberString.length;
    const newString = "1" + Array(numberLen).join("0");
    return newString;
  }

  constructor(value: number) {
    this.value = value;
    this.valueWithUnit = this.convert(value);
  }
}

class ScalarUnit {
  value: number;
  valueWithUnit: string;
  units = {
    0: { unitSCale: "It/s" },
    1000: { unitScale: "KIt/s" },
    1000000: { unitScale: "MIt/s" },
  };

  convert(n: number): string {
    const numberString = n.toString();
    const numberLen = numberString.length;
    const newString = "1" + Array(numberLen).join("0");
    return newString;
  }

  constructor(value: number) {
    this.value = value;
    this.valueWithUnit = this.convert(value);
  }
}

class Benchmark {
  name: string;
  fullname: string;
  iterations: ScalarUnit;
  mean: TimeUnit;

  constructor(benchmark: string) {
    this.name = benchmark["name"];
    this.fullname = benchmark["fullname"];
    const stats = benchmark["stats"];
    this.iterations = new ScalarUnit(stats["iterations"]);
    this.mean = new TimeUnit(stats["mean"]);
  }
}

function readJSON(filename: string): any {
  const rawData = fs.readFileSync(filename);
  const benchmarkJSON = JSON.parse(rawData);

  let benchmarks: { [name: string]: Benchmark } = {};
  for (const benchmark of benchmarkJSON["benchmarks"]) {
    benchmarks[benchmark["fullname"]] = new Benchmark(benchmark);
  }

  return benchmarks;
}

function inputValidate(
  provided: Array<string>,
  permissable: Array<string>,
  inputName: string
): void {
  if (provided.filter((x) => !permissable.includes(x)).length > 0) {
    core.setFailed(
      `Invalid value for ${inputName}: ${provided.join(
        ", "
      )} - valid values for ${inputName} are: ${permissable.join(", ")}`
    );
    return;
  }
}

async function run() {
  if (github.context.eventName !== "pull_request") {
    core.setFailed("Can only run on pull requests!");
    return;
  }

  const githubToken = core.getInput("token");
  const benchmarkFileName = core.getInput("benchmark-file");
  const oldBenchmarkFileName = core.getInput("comparison-benchmark-file");
  const oldBenchmarkMetric = core.getInput("comparison-benchmark-metric");
  const benchmarkMetrics: string[] = core
    .getInput("benchmark-metrics")
    .split(",")
    .filter((x) => x !== "");

  const benchmarks = readJSON(benchmarkFileName);
  for (const benchmark in benchmarks) {
    console.log(benchmark);
  }

  let message = "";

  console.log(message);

  const context = github.context;
  const pullRequestNumber = context.payload.pull_request.number;

  const octokit = github.getOctokit(githubToken);

  // Now decide if we should issue a new comment or edit an old one
  const { data: comments } = await octokit.issues.listComments({
    ...context.repo,
    issue_number: pullRequestNumber,
  });

  const comment = comments.find((comment) => {
    return (
      comment.user.login === "github-actions[bot]" &&
      comment.body.startsWith("## Result of Benchmark Tests\n")
    );
  });

  if (comment) {
    await octokit.issues.updateComment({
      ...context.repo,
      comment_id: comment.id,
      body: message
    });
  } else {
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: pullRequestNumber,
      body: message
    });
  }
}

run().catch(error => core.setFailed("Workflow failed! " + error.message));
