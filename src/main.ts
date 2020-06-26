const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");

class Benchmark {
  max : number;
  min : number;
  mean : number;
  stddev : number;

  constructor(benchmark: any) {
    const stats = benchmark["stats"];
    this.max = stats["max"].toFixed(2);
    this.min = stats["min"].toFixed(2);
    this.mean = stats["mean"].toFixed(2);
    this.stddev = stats["stddev"].toFixed(2);
  }
}

function readJSON(filename: string): any {
  const rawdata = fs.readFileSync(filename);
  const benchmarkJSON = JSON.parse(rawdata);

  let benchmarks : { [name: string] : Benchmark} = {};
  for(const benchmark of benchmarkJSON["benchmarks"]) {
    benchmarks[benchmark["fullname"]] = new Benchmark(benchmark);
  }

  return benchmarks;
}

function createMessage(benchmarks: any, oldBenchmarks: any) {
  let message = "## Result of Benchmark Tests\n";

  // Table Title
  message += "| Benchmark | Min | Max | Mean |";
  if(oldBenchmarks !== undefined) {
    message += " Mean on Repo `HEAD` |"
  }
  message += "\n";

  // Table Column Definition
  message += "| :--- | :---: | :---: | :---: |";
  if(oldBenchmarks !== undefined) {
    message += " :---: |"
  }
  message += "\n";

  // Table Rows
  for (const benchmarkName in benchmarks) {
    const benchmark = benchmarks[benchmarkName];

    message += `| ${benchmarkName}`;
    message += `| ${benchmark.min}`;
    message += `| ${benchmark.max}`;
    message += `| ${benchmark.mean} `;
    message += `+- ${benchmark.stddev} `;

    if(oldBenchmarks !== undefined) {
      const oldBenchmark = oldBenchmarks[benchmarkName]
      message += `| ${oldBenchmark.mean} `;
      message += `+- ${oldBenchmark.stddev} `;
    }
    message += "|\n"
  }

  return message;
}

async function run() {
  if (github.context.eventName !== "pull_request") {
    core.setFailed("Can only run on pull requests!");
    return;
  }

  const githubToken = core.getInput("token");
  const benchmarkFileName = core.getInput("benchmark-file");
  const oldBenchmarkFileName = core.getInput("comparison-benchmark-file");

  const benchmarks = readJSON(benchmarkFileName);
  let oldBenchmarks = undefined;
  if(oldBenchmarkFileName) {
    try {
      oldBenchmarks = readJSON(oldBenchmarkFileName);
    } catch (error) {
      console.log("Can not read comparison file. Continue without it.");
    }
  }
  const message = createMessage(benchmarks, oldBenchmarks);
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

try {
  run()
} catch (error) {
  console.log("Workflow failed!", error);
}
