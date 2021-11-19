import { CKBOptions } from '../src/options';
import { CKBJson } from '../src/pack';
import { zhCN } from '../src/i18n/zh-CN';

test('i18n', () => {
  // Every option of chart concepts should be translated.
  const CKBOptions0 = CKBOptions();
  let allOptionsTranslated = true;
  Object.keys(CKBOptions0).forEach((c) => {
    CKBOptions0[c].forEach((option) => {
      if (!zhCN.concepts[c][option]) {
        // eslint-disable-next-line no-console
        console.log(`MISS TRANSLATION FOR **${c}.${option}**`);
        allOptionsTranslated = false;
      }
    });
  });
  expect(allOptionsTranslated).toBe(true);

  // Every record of chart type should be translated.
  const ckb0 = CKBJson();
  let allChartInfosTranslated = true;
  Object.keys(ckb0).forEach((cid) => {
    if (ckb0[cid].name && !zhCN.chartTypes[cid].name) {
      // eslint-disable-next-line no-console
      console.log(`MISS TRANSLATION name FOR **${cid}**`);
      allChartInfosTranslated = false;
    }
    if (ckb0[cid].def && (!zhCN.chartTypes[cid].def || zhCN.chartTypes[cid].def === 'TBD')) {
      // eslint-disable-next-line no-console
      console.log(`MISS TRANSLATION def FOR **${cid}**`);
      allChartInfosTranslated = false;
    }
  });
  expect(allChartInfosTranslated).toBe(true);
});
