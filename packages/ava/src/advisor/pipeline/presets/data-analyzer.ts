import { dataProcessorPlugin } from '../../advise-pipeline';
import { PresetComponentName } from '../../constants';
import { BaseComponent, type ComponentOptions } from '../component';

export class DataAnalyzer extends BaseComponent {
  constructor(options: ComponentOptions) {
    super(PresetComponentName.dataAnalyzer, {
      plugins: [dataProcessorPlugin],
      ...options,
    });
  }
}
