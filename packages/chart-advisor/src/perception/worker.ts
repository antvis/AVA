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
        const dimensionTitle = columnProps[fixnum[scagOut[i].indX!]].title;
        const measureTitle = columnProps[fixnum[scagOut[i].indY!]].title;

        const subData = columnsToRowData([columns[fixnum[scagOut[i].indX!]], columns[fixnum[scagOut[i].indY!]]], [dimensionTitle, measureTitle]);

        insights.push({
            type: 'Perception',
            description: `Perceptual insight with '${
                SCAG_TYPES[scagOut[i].k!]
                }'`,
            fields: [columnProps[fixnum[scagOut[i].indX!]].title as string,
            columnProps[fixnum[scagOut[i].indY!]].title as string],
            present: {
                purpose: ['Distribution'],
                type: 'scatter_plot',
                data: subData,
                encoding: {
                    x: columnProps[fixnum[scagOut[i].indX!]].title,
                    y: columnProps[fixnum[scagOut[i].indY!]].title,
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
