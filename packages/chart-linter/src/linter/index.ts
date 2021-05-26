import WasmClingoModule from 'wasm-clingo';
import { schema2asp } from 'draco-core';
import * as CONSTRAINTS from './rules';
import { Rule, RULE_KEYS } from '../interfaces';

export interface SolveOptions {
  /**
   * Empty means all.
   */
  constraints?: string[];

  /**
   * Number of models.
   */
  models?: number;
}

export interface Schema {
  stats: any;
  size: number;
}

export class Linter {
  initialized = false;

  private Module: any;
  private stdout = '';
  /**
   * Data schema containing column statistics.
   */
  private schema: Schema | null;
  private constraints: Record<string, string>;

  constructor(updateStatus: (text: string) => void = console.log) {
    let url = 'https://unpkg.com/wasm-clingo@0.3.0';

    if (url.substr(url.length - 1) !== '/') {
      url += '/';
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const bindThis = this;

    const m = {
      // Where to locate clingo.wasm
      locateFile: (file: string) => `${url}${file}`,

      setStatus: updateStatus,

      print: (text: string) => {
        bindThis.stdout += text;
      },

      totalDependencies: 0,

      printErr: (err: Error) => {
        if (err) {
          m.setStatus('Received output on stderr.');
          console.warn(err);
        }
      },
    };

    this.Module = m;
    this.schema = null;
    this.constraints = CONSTRAINTS;
  }

  init() {
    return new Promise((resolve) => {
      this.Module.setStatus('Downloading...');
      this.Module.onRuntimeInitialized = () => {
        this.initialized = true;
        resolve(this);
      };

      WasmClingoModule(this.Module);
    });
  }

  solve(program: string, options: SolveOptions = {}) {
    if (!this.initialized) {
      throw Error('Linter is not initialized. Call `init()` first.');
    }

    this.Module.setStatus('Running...');

    // Add dataset-describe ASP to program
    const dataDecl = this.getDataDeclaration();
    program += dataDecl;

    // Add constraints (by custom or by all defaults)
    const constraintGroupKeys = options.constraints || Object.keys(this.constraints);
    program += constraintGroupKeys.map((groupKey: string) => this.constraints[groupKey]).join('\n\n');

    const opt = [
      '--outf=2', // JSON output
      '--opt-mode=OptN', // find multiple optimal models
      '--quiet=1', // only output optimal models
      '--project', // every model only once
      options.models || 1,
    ].join(' ');

    this.stdout = '';

    this.Module.ccall('run', 'number', ['string', 'string'], [program, opt]);

    const result = JSON.parse(this.stdout);

    if (result.Result === 'UNSATISFIABLE') {
      console.debug('UNSATISFIABLE');
      console.debug(result);
      return null;
    }

    const answers = this.getAnswers(result);

    const violates = this.formatRules(answers);

    this.Module.setStatus(JSON.stringify(violates));

    return { rules: violates };
  }

  private getDataDeclaration(): string {
    if (!this.schema) {
      return '';
    }

    return schema2asp(this.schema).join('\n');
  }

  private getAnswers(json: any) {
    return (json?.Call || []).reduce((answers: any[], callEle: any) => {
      callEle.Witnesses.forEach((wit: any) => {
        if (wit.Value) {
          answers.push(wit.Value);
        }
      });
      return answers;
    }, []);
  }

  private formatRules(answers: string[][]): Rule[][] {
    if (!answers || answers.length === 0) return [];

    const violates: Rule[][] = [];

    answers.forEach((ans) => {
      const ruleSet: Rule[] = [];

      ans.forEach((constraint) => {
        let params: string[] = [];

        const args = /\(\s*([^)]+?)\s*\)/.exec(constraint);
        if (args && args.length >= 1) {
          params = args[1].split(/\s*,\s*/);
        }

        const rule: any = {};

        params.forEach((val, idx) => {
          const key = RULE_KEYS[idx];
          if (key) {
            rule[key] = val;
          }
        });

        if (Object.keys(rule).length) {
          ruleSet.push(rule);
        }
      });

      violates.push(ruleSet);
    });

    return violates;
  }
}
