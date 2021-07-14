const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");
import { Benchmark } from "./benchmark";
import { createMessage } from "./utils";

function readJSON(filename: string): any {
  const rawData = fs.readFileSync(filename);
  const benchmarkJSON = JSON.parse(rawData);

  let benchmarks: { [name: string]: Benchmark } = {};
  for (const benchmark of benchmarkJSON["benchmarks"]) {
    benchmarks[benchmark["fullname"]] = new Benchmark(benchmark);
  }

  return benchmarks;
}

async function run() {
  if (github.context.eventName !== "pull_request") {
    core.setFailed("Can only run on pull requests!");
    return;
  }

  const githubToken = core.getInput("token");
  const benchmarkFileName = core.getInput("benchmark-file");
  const previousBenchmarkFileName = core.getInput("comparison-benchmark-file");
  const comparisonMetric = core.getInput("comparison-benchmark-metric");
  const benchmarkMetrics: string[] = core
    .getInput("benchmark-metrics")
    .split(",")
    .filter((x) => x !== "");

  const benchmarks = readJSON(benchmarkFileName);
  let previousBenchmarks = undefined;
  if (previousBenchmarkFileName) {
    try {
      previousBenchmarks = readJSON(previousBenchmarkFileName);
    } catch (error) {
      console.log("Can not read comparison file. Continue without it.");
    }
  }
  const message = createMessage(
    benchmarks,
    previousBenchmarks,
    benchmarkMetrics,
    comparisonMetric
  );
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
      body: message,
    });
  } else {
    await octokit.issues.createComment({
      ...context.repo,
      issue_number: pullRequestNumber,
      body: message,
    });
  }
}

run().catch((error) => core.setFailed("Workflow failed! " + error.message));
