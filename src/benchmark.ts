export class Benchmark {
  fullname: StringUnit;
  iterations: NumberUnit;
  max: TimeUnit;
  mean: TimeUnit;
  median: TimeUnit;
  min: TimeUnit;
  name: StringUnit;
  ops: OperationsUnit;
  rounds: NumberUnit;
  stddev: TimeUnit;

  constructor(benchmark: string) {
    const stats = benchmark["stats"];
    this.fullname = new StringUnit(benchmark["fullname"]);
    this.iterations = new NumberUnit(stats["iterations"]);
    this.max = new TimeUnit(stats["max"]);
    this.mean = new TimeUnit(stats["mean"]);
    this.median = new TimeUnit(stats["median"]);
    this.min = new TimeUnit(stats["min"]);
    this.name = new StringUnit(benchmark["name"]);
    this.ops = new OperationsUnit(stats["ops"]);
    this.rounds = new NumberUnit(stats["rounds"]);
    this.stddev = new TimeUnit(stats["stddev"]);
  }
}
class StringUnit {
  value: string;
  valueWithUnit: string;
  constructor(value: string) {
    this.value = value;
    this.valueWithUnit = value;
  }
}

class NumberUnit {
  value: number;
  valueWithUnit: number;
  constructor(value: number) {
    this.value = value;
    this.valueWithUnit = value;
  }
}

class TimeUnit {
  value: number;
  valueWithUnit: string;

  convert(n) {
    let order = -Math.floor(Math.log(n) / Math.log(10) + 1);
    switch (true) {
      case order >= 4:
        return `${(n * 1000000).toFixed(4)}μs`;
      case order >= 1:
        return `${(n * 1000).toFixed(4)}ms`;
      default:
        return `${n.toFixed(4)}s`;
    }
  }

  constructor(value: number) {
    this.value = value;
    this.valueWithUnit = this.convert(value);
  }
}

class OperationsUnit {
  value: number;
  valueWithUnit: string;

  convert(n: number) {
    var order = Math.floor(Math.log(n) / Math.LN10 + 0.000000001);
    switch (true) {
      case order >= 6:
        return `${(n / 1000000).toFixed(4)} MOps/s`;
      case order >= 3:
        return `${(n / 1000).toFixed(4)} KOps/s`;
      default:
        return `${n.toFixed(4)} Ops/s`;
    }
  }

  constructor(value: number) {
    this.value = value;
    this.valueWithUnit = this.convert(value);
  }
}
