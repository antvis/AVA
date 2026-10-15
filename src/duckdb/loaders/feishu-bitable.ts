
import { FeishuBitableSourceOptions, LoadedSource } from '../../types';
import {readTable} from './feishu/read';

import { loadJson } from './json';



export async function loadFeishuBitable(options: FeishuBitableSourceOptions):Promise<LoadedSource>{
    const data = await readTable(options);
    return loadJson({data});
}