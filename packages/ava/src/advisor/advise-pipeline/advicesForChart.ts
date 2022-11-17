/**
 * TODO
 * -- DataFrame 改为从 dw 直接引入
 */

 import { DataFrame } from '../../data';
 import { cloneDeep } from '../utils';

 import { dataToAdvices } from './data-to-advices';

 import type { ChartKnowledgeBase } from '../../ckb/types';
 import type { AdviseResult, ChartAdviseParams } from '../types';
 import type { BasicDataPropertyForAdvice, RuleModule } from '../ruler';

 export function advicesForChart(params: ChartAdviseParams, exportLog = false, ckb: ChartKnowledgeBase, ruleBase: Record<string, RuleModule>): AdviseResult {
   const { data, dataProps, smartColor, options, colorOptions } = params;
   // otherwise the input data will be mutated
   const copyData = cloneDeep(data);
   const { fields } = params as ChartAdviseParams;
   // transform data into DataFrame
   let dataFrame: DataFrame;
   try {
     if (fields) {
       dataFrame = new DataFrame(copyData, { columns: fields });
     } else {
       dataFrame = new DataFrame(copyData);
     }
   } catch (error) {
     // if the input data cannot be transformed into DataFrame
     // eslint-disable-next-line no-console
     console.error('error: ', error);
     return [];
   }

   // get dataProps from dataframe
   let dataPropsForAdvice: BasicDataPropertyForAdvice[];
   if (dataProps) {
     // filter out fields that are not included for advising
     dataPropsForAdvice = fields
       ? dataProps.filter((dataProp: BasicDataPropertyForAdvice) => fields.includes(dataProp.name))
       : dataProps;
   } else {
     dataPropsForAdvice = dataFrame.info() as BasicDataPropertyForAdvice[];
   }

   // filter out fields that are not included for advising
   let filteredData: Record<string, any>[] = [];
   if (fields) {
     filteredData = copyData.map((row: Record<string, any>) => {
       const filteredRow = row;
       Object.keys(filteredRow).forEach((col) => {
         if (!fields.includes(col)) {
           delete filteredRow[col];
         }
       });
       return row;
     });
   } else {
     filteredData = copyData;
   }

   const adviceResult = dataToAdvices(
     filteredData,
     dataPropsForAdvice,
     ckb,
     ruleBase,
     smartColor,
     { ...options, exportLog },
     colorOptions
   );
   return adviceResult;
 }
