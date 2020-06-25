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
        uses: nils-braun/pytest-benchmark-commenter@v1
```

The github action is only supported for pull request events.

## Configuration

| Name | Default | Description |
|------|---------|-------------|
| github-token | `${{ secrets.GITHUB_TOKEN }}` | Change this, if you do not want to use the default token |
| benchmark-file | `output.json` | Where your benchmark file is stored |
