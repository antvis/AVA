import { RowData } from '@antv/dw-transform';
import { Insight, SCAG_TYPES, InsightType } from './findScag/interface';
import { rowDataToColumnFrame, columnsToRowData } from '../insight/insightWorkers/utils';
import { scagInsighter, scagResult } from './insighter';
import { JSONto2DArray } from './advisor';


/**
 * @beta
 */
export type Worker = (data: RowData[]) => Insight[] | Promise<Insight[]>;

export const perceptionIW: Worker = function (data: RowData[]): Insight[] {
    const insights: Insight[] = [];

    const { columnProps, columns } = rowDataToColumnFrame(data);
    const data2d = JSONto2DArray(data);

    let scagOut: scagResult[] | boolean = [];

    scagOut = scagInsighter(data2d);
    if (scagOut === false) {
        throw new TypeError('no perceptual insight');
    }

    for (let i = 0; i < scagOut.length; ++i) {
        const dimensionTitle = columnProps[scagOut[i].indX!].title;
        const measureTitle = columnProps[scagOut[i].indY!].title;

        const subData = columnsToRowData([columns[scagOut[i].indX!], columns[scagOut[i].indY!]], [dimensionTitle, measureTitle]);

        insights.push({
            type: 'Perception',
            description: `Perceptual insight with '${
                SCAG_TYPES[scagOut[i].k!]
                }'`,
            fields: [columnProps[scagOut[i].indX!].title as string,
            columnProps[scagOut[i].indY!].title as string],
            present: {
                purpose: ['Relation'],
                type: 'scatter_plot',
                data: subData,
                encoding: {
                    x: columnProps[scagOut[i].indX!].title,
                    y: columnProps[scagOut[i].indY!].title,
                },
                configs: { xAxis: { title: { visible: true } }, yAxis: { title: { visible: true } } },
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
