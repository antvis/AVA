import {
  FAMILY_OPTIONS,
  GRAPHIC_CATEGORY_OPTIONS,
  PURPOSE_OPTIONS,
  COORD_TYPE_OPTIONS,
  SHAPE_OPTIONS,
  CHANNEL_OPTIONS,
  LOM_OPTIONS,
  RECOMMEND_RATING_OPTIONS,
} from './interface';
import { Language, I18N } from './i18n';

/**
 * @param lang - Language of the options.
 * @public
 */
export function CKBOptions(lang: Language = 'en-US') {
  if (lang && lang !== 'en-US') {
    const translator = I18N(lang);

    if (translator && translator.concepts) {
      const { concepts } = translator;

      return {
        family: Object.values(concepts.family),
        category: Object.values(concepts.category),
        purpose: Object.values(concepts.purpose),
        coord: Object.values(concepts.coord),
        shape: Object.values(concepts.shape),
        channel: Object.values(concepts.channel),
        lom: Object.values(concepts.lom),
        recRate: Object.values(concepts.recRate),
      };
    }
  }

  return {
    family: [...FAMILY_OPTIONS] as string[],
    category: [...GRAPHIC_CATEGORY_OPTIONS] as string[],
    purpose: [...PURPOSE_OPTIONS] as string[],
    coord: [...COORD_TYPE_OPTIONS] as string[],
    shape: [...SHAPE_OPTIONS] as string[],
    channel: [...CHANNEL_OPTIONS] as string[],
    lom: [...LOM_OPTIONS] as string[],
    recRate: [...RECOMMEND_RATING_OPTIONS] as string[],
  };
}
