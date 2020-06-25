# Comment with PyTest Benchmark Github Action

This GitHub action comments on a pull request with the benchmark results written out from a `pytest-benchmark` run.

## Usage

Create (or update) a workflow file in `.github/workflow/benchmark.yml`
and add this action after you run your benchmark tests.
You might need to tweak the installation and test run below to your own needs.

```yaml

name: Benchmark
on: [pull_request]

jobs:
  benchmark:
    name: Run pytest-benchmark
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v1
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      - name: Run benchmark
        run: |
          pytest benchmark.py --benchmark-only --benchmark-json output.json
      - name: Publish results
        uses: nils-braun/pytest-benchmark-commenter@v2
```

The github action is only supported for pull request events.

## Configuration

| Name | Default | Description |
|------|---------|-------------|
| github-token | `${{ secrets.GITHUB_TOKEN }}` | Change this, if you do not want to use the default token |
| benchmark-file | `output.json` | Where your benchmark file is stored |
| comparison-benchmark-file | empty | Where to find the json output of an old pytest-benchmark, for comparison. Empty for no comparison. |

## Usage for comparison

If you want to compare the results of the benchmarks now to the most recent run on your default branch, you could do the following:

Create a workflow to upload the benchmarks on your default branch, e.g. `upload.yml`:

```yaml
name: Upload the artifact
on:
  push:
    branches:
      - <your default branch>

jobs:
  test_action_job:
    runs-on: ubuntu-latest
    name: Test out the action in this repository
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      ... do the benchmarking ...

      - name: Upload the file
        uses: actions/upload-artifact@v2
        with:
          name: benchmark_results
          path: output.json
```

Now you can reference this in your workflow for comparison:

```yaml
name: Test Action
on:
  pull_request:
    branches:
      - master

jobs:
  test_action_job:
    runs-on: ubuntu-latest
    name: Test out the action in this repository
    steps:
      - name: Checkout
        uses: actions/checkout@v2

      ... do the benchmarking ...

      - name: Download artifact
        uses: dawidd6/action-download-artifact@v2
        with:
          github_token: ${{ github.token }}
          workflow: upload.yml
          name: benchmark_results
          path: old_benchmark
          commit: ${{github.event.pull_request.base.sha}}
        continue-on-error: true
      - name: Run the action
        uses: nils-braun/pytest-benchmark-commenter@v2
        with:
          comparison-benchmark-file: "old_benchmark/output.json"
```