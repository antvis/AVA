import { RuleConfig } from '../ruler/index';

export class Linter {
  // TODO: FIX this
  private ruleCfg: RuleConfig | undefined;

  constructor(ruleCfg?: RuleConfig) {
    this.ruleCfg = ruleCfg;
  }

  getRuleCfg() {
    return this.ruleCfg;
  }

  /**
   *
   * @param spec chart spec written in antv-spec
   * @returns error[], the issues violated by the chart spec
   */
  lint(spec: any) {
    // TODO:
    if (spec) {
      return [];
    }
    return [];
  }
}
