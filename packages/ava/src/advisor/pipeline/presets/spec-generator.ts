import { specGeneratorPlugin } from '../../advise-pipeline';
import { PresetComponentName } from '../../constants';
import { BaseComponent, type ComponentOptions } from '../component';

export class SpecGenerator extends BaseComponent {
  constructor(options: ComponentOptions) {
    super(PresetComponentName.specGenerator, {
      plugins: [specGeneratorPlugin],
      ...options,
    });
  }
}
