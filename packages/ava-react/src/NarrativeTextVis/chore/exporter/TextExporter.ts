import {
  NarrativeTextSpec,
  ParagraphSpec,
  SectionSpec,
  PhraseSpec,
  BulletItemSpec,
  isCustomSection,
  isStandardSection,
  isHeadingParagraph,
  isTextParagraph,
  isBulletParagraph,
  isCustomParagraph,
  isCustomPhrase,
  isEntityPhrase,
  getHeadingWeight,
} from '@antv/narrative-text-schema';
import { pad } from 'lodash';
import { PluginManager } from '../plugin';
import { ImageExtra, transformHtml } from './helpers/transformHtml';

export class TextExporter extends PluginManager {
  /**
   * Export your text schema as pure text.
   * @param {NarrativeTextSpec} spec - the narrative text schema you want to export
   * @returns
   */
  getNarrativeText(spec: NarrativeTextSpec) {
    let text = '';
    if (spec?.headline?.phrases) text += this.getPhrasesText(spec.headline.phrases);
    if (spec?.sections) {
      text = spec?.sections?.reduce((prev, curr) => `${prev}${prev ? '\r\n' : ''}${this.getSectionText(curr)}`, text);
    }
    return text;
  }

  getSectionText(spec: SectionSpec) {
    if (isStandardSection(spec)) {
      return spec.paragraphs.reduce((prev, curr) => `${prev}\r\n${this.getParagraphText(curr)}`, '');
    }
    if (isCustomSection(spec)) {
      const descriptor = this.getBlockDescriptor(spec.customType);
      if (descriptor && descriptor?.getText) {
        return descriptor.getText(spec);
      }
    }
    return '';
  }

  getParagraphText(spec: ParagraphSpec) {
    if (isHeadingParagraph(spec) || isTextParagraph(spec)) return this.getPhrasesText(spec.phrases);
    if (isBulletParagraph(spec)) {
      const level = 1;
      return spec.bullets?.reduce(
        (prev, curr, index) =>
          // if is ordered bullet, add '1. xxxxxx'
          // else, add '· xxxxxx'
          `${prev}${prev ? '\r\n' : ''}${spec.isOrder ? `${index + 1}. ` : '· '}${this.getBulletsText(curr, level)}`,
        '',
      );
    }
    if (isCustomParagraph(spec)) {
      const descriptor = this.getBlockDescriptor(spec.customType);
      if (descriptor && descriptor?.getText) {
        return descriptor.getText(spec);
      }
    }
    return '';
  }

  getBulletsText(spec: BulletItemSpec, level = 1): string {
    let text = '';
    if (spec?.phrases) {
      text = this.getPhrasesText(spec.phrases);
    }
    if (spec?.subBullet) {
      text = spec.subBullet.bullets?.reduce(
        (prev, curr, index) =>
          // if is ordered bullet, add paddings + '1. xxxxxx'
          // else, add paddings + '· xxxxxx'
          // padding number here is 2
          `${prev}\r\n${pad('', level * 2)}${spec.subBullet.isOrder ? `${index + 1}. ` : '· '}${this.getBulletsText(
            curr,
            level + 1,
          )}`,
        text,
      );
    }
    return text;
  }

  getPhrasesText(spec: PhraseSpec[]) {
    return spec.reduce((prev, curr) => {
      let text = curr?.value;
      if (isEntityPhrase(curr) || isCustomPhrase(curr)) {
        const descriptor = this.getPhraseDescriptorBySpec(curr);
        if (descriptor && descriptor?.getText) {
          text = descriptor.getText(curr.value, curr.metadata);
        }
      }
      return prev + text;
    }, '');
  }

  /**
   * Export your text schema as Markdown.
   * @param {NarrativeTextSpec} spec - the narrative text schema you want to export
   * @returns
   */
  getNarrativeMarkdown(spec: NarrativeTextSpec) {
    let text = '';
    // if there is a headline, add '# Headline' and a horizontal rule beneath
    if (spec?.headline?.phrases) text += `# ${this.getPhrasesMarkdown(spec.headline.phrases)}\r\n\r\n---`;
    if (spec?.sections) {
      text = spec?.sections?.reduce(
        (prev, curr) => `${prev}${prev ? '\r\n' : ''}${this.getSectionMarkdown(curr)}`,
        text,
      );
    }
    return text;
  }

  getSectionMarkdown(spec: SectionSpec) {
    if (isStandardSection(spec)) {
      return spec.paragraphs.reduce((prev, curr) => `${prev}\r\n${this.getParagraphMarkdown(curr)}`, '');
    }
    if (isCustomSection(spec)) {
      const descriptor = this.getBlockDescriptor(spec.customType);
      if (descriptor?.getMarkdown) {
        return descriptor.getMarkdown(spec);
      }
      if (descriptor?.getText) {
        return descriptor.getText(spec);
      }
    }
    return '';
  }

  getParagraphMarkdown(spec: ParagraphSpec) {
    if (isTextParagraph(spec)) return this.getPhrasesMarkdown(spec.phrases);
    if (isHeadingParagraph(spec)) {
      return `${'#'.repeat(getHeadingWeight(spec.type))} ${this.getPhrasesMarkdown(spec.phrases)}`;
    }
    if (isBulletParagraph(spec)) {
      const level = 1;
      return spec.bullets?.reduce(
        (prev, curr, index) =>
          // if is ordered bullet, add '1. xxxxxx'
          // else, add '- xxxxxx'
          `${prev}${prev ? '\r\n' : ''}${spec.isOrder ? `${index + 1}. ` : '- '}${this.getBulletsMarkdown(
            curr,
            level,
          )}`,
        '',
      );
    }
    if (isCustomParagraph(spec)) {
      const descriptor = this.getBlockDescriptor(spec.customType);
      if (descriptor?.getMarkdown) {
        return descriptor.getMarkdown(spec);
      }
      if (descriptor?.getText) {
        return descriptor.getText(spec);
      }
    }
    return '';
  }

  getBulletsMarkdown(spec: BulletItemSpec, level = 1): string {
    let text = '';
    if (spec?.phrases) {
      text = this.getPhrasesMarkdown(spec.phrases);
    }
    if (spec?.subBullet) {
      text = spec.subBullet.bullets?.reduce(
        (prev, curr, index) =>
          // if is ordered bullet, add paddings + '1. xxxxxx'
          // else, add paddings + '- xxxxxx'
          // padding number in markdown should be 4
          `${prev}\r\n${pad('', level * 4)}${spec.subBullet.isOrder ? `${index + 1}. ` : '- '}${this.getBulletsMarkdown(
            curr,
            level + 1,
          )}`,
        text,
      );
    }
    return text;
  }

  // TODO: in getPhrasesMarkdown, support styles defined by entity type and user customization
  getPhrasesMarkdown(spec: PhraseSpec[]) {
    return spec.reduce((prev, curr) => {
      let text = curr?.value;
      if (isEntityPhrase(curr) || isCustomPhrase(curr)) {
        const descriptor = this.getPhraseDescriptorBySpec(curr);
        if (descriptor?.getMarkdown) {
          return descriptor.getMarkdown(curr.value, curr.metadata);
        }
        if (descriptor?.getText) {
          return descriptor.getText(curr.value, curr.metadata);
        }
      } else {
        if (curr.bold) {
          text = `**${text}**`;
        }
        if (curr.italic) {
          text = `*${text}*`;
        }
      }
      return prev + text;
    }, '');
  }

  /**
   * get html string of narrative-vis content in container, the svg and canvas elements are converted to image by default
   * @param container the container of narrative-vis content
   * @param imageExtra the jump link to add to the image element
   * @param replaceType replace the svg and canvas elements with image or text, so that they can be copied and pasted into some rich-text editors
   */
  async getNarrativeHtml(container: HTMLElement, imageExtra?: ImageExtra, replaceType: 'image' | 'text' | 'none' = 'image') {
    const elements = container?.getElementsByClassName('ntv-container');
    const transformedHtml = await transformHtml({elements, imageExtra, replaceType});
    return transformedHtml;
  }
}
