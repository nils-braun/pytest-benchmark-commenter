const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs");

function readJSON(filename: string): any {
  const rawdata = fs.readFileSync(filename);
  const benchmark = JSON.parse(rawdata);
  return benchmark;
}

function createMessage(benchmarks: any) {
  let message = "## Result of Benchmark Tests\n";

  message += "| Benchmark | Min | Max | Mean |\n";
  message += "| :--- | :---: | :---: | :---: |\n";
  for (const benchmark of benchmarks["benchmarks"]) {
    const stats = benchmark["stats"];

    message += `| ${benchmark["fullname"]}`;
    message += `| ${stats["min"].toFixed(2)}`;
    message += `| ${stats["max"].toFixed(2)}`;
    message += `| ${stats["mean"].toFixed(2)} `;
    message += `+- ${stats["stddev"].toFixed(2)} |\n`;
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

  const benchmarks = readJSON(benchmarkFileName);
  const message = createMessage(benchmarks);

  const context = github.context;
  const pullRequestNumber = context.payload.pull_request.number;

  const octokit = new github.GitHub(githubToken);

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
    octokit.issues.updateComment({
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

run().catch(error => core.setFailed(error.message));
