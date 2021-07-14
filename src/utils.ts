const core = require("@actions/core");
import { markdownTable } from "markdown-table";


function titleCase(str) {
  return str.replace(
    /\w\S*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

export function createMessage(
  benchmarks: any,
  oldBenchmarks: any,
  metrics: Array<string>,
  compareMetric: string
) {
  const title = "## Result of Benchmark Tests";
  let table: string[][] = [];

  // Header building
  let headers = [...metrics.map(metric => titleCase(metric))];
  if (oldBenchmarks !== undefined) {
    headers.push(...[titleCase(compareMetric) + " on Repo `HEAD`", "Change"]);
  }
  table.push(headers);

  // Table Rows per Benchmark
  for (const benchmarkName in benchmarks) {
    const benchmark = benchmarks[benchmarkName];
    let row = Array();

    for (const metric of metrics) {
      row.push(benchmark[metric].valueWithUnit);
    }

    if (oldBenchmarks !== undefined) {
      row.push(
        ...[
          oldBenchmarks[benchmarkName][compareMetric].valueWithUnit,
          (
            (benchmark[compareMetric].value /
              oldBenchmarks[benchmarkName][compareMetric].value) *
            100
          ).toFixed(2) + "%",
        ]
      );
    }
    table.push(row);
  }

  return title + "\n" + markdownTable(table);
}
export function inputValidate(
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
