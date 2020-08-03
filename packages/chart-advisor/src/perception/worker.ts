import { RowData } from '@antv/dw-transform';
import {
    Insight,
    SCAG_TYPES,
    InsightType,
    scagResult,
    scagFixData
} from './findScag/interface';
import { rowDataToColumnFrame, columnsToRowData } from '../insight/insightWorkers/utils';
import { scagInsighter } from './insighter';
import { JSONto2DArray } from './advisor';


/**
 * @beta
 */
export type Worker = (data: RowData[]) => Insight[] | Promise<Insight[]>;

export const perceptionIW: Worker = function (data: RowData[]): Insight[] {
    const insights: Insight[] = [];

    const { columnProps, columns } = rowDataToColumnFrame(data);

    let scagData: scagFixData;

    scagData = JSONto2DArray(data);

    const data2d = scagData.outArr;
    const fixnum = scagData.fixnum;

    let scagOut: scagResult[] | boolean = [];

    scagOut = scagInsighter(data2d);
    if (scagOut === false) {
        throw new TypeError('no perceptual insight');
    }

    for (let i = 0; i < scagOut.length; ++i) {
        const dimensionTitle = columnProps[scagOut[i].indX! + fixnum].title;
        const measureTitle = columnProps[scagOut[i].indY! + fixnum].title;

        const subData = columnsToRowData([columns[scagOut[i].indX! + fixnum], columns[scagOut[i].indY! + fixnum]], [dimensionTitle, measureTitle]);

        insights.push({
            type: 'Perception',
            description: `Perceptual insight with '${
                SCAG_TYPES[scagOut[i].k!]
                }'`,
            fields: [columnProps[scagOut[i].indX! + fixnum].title as string,
            columnProps[scagOut[i].indY! + fixnum].title as string],
            present: {
                purpose: ['Perception'],
                type: 'scatter_plot',
                data: subData,
                encoding: {
                    x: columnProps[scagOut[i].indX! + fixnum].title,
                    y: columnProps[scagOut[i].indY! + fixnum].title,
                },
                configs: {
                    xAxis: { title: { visible: true } },
                    yAxis: { title: { visible: true } }
                },
            },
        });
    }

    return insights;
};

/**
 * @beta
 */
export const perceptionWorkers: Partial<Record<InsightType, Worker>> = {
    Perception: perceptionIW
};
