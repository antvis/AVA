import { visualEncoderPlugin } from '../../advise-pipeline';
import { PresetComponentName } from '../../constants';
import { BaseComponent, type ComponentOptions } from '../component';

export class ChartEncoder extends BaseComponent {
  constructor(options: ComponentOptions) {
    super(PresetComponentName.chartEncoder, {
      plugins: [visualEncoderPlugin],
      ...options,
    });
  }
}
