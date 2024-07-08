import { chartTypeRecommendPlugin } from '../../advise-pipeline';
import { PresetComponentName } from '../../constants';
import { BaseComponent, type ComponentOptions } from '../component';

export class ChartTypeRecommender extends BaseComponent {
  constructor(options: ComponentOptions) {
    super(PresetComponentName.chartTypeRecommender, {
      plugins: [chartTypeRecommendPlugin],
      ...options,
    });
  }
}
