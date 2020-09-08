import { isArray, isObject } from 'lodash';

/**
 * Determines whether it is an object array type
 * typeof data in g2plot is all `Record<string, any>[]`
 * @param data
 */
export const isObjArr = (data: any) => (isArray(data) ? data.every((d) => isObject(d)) : false);
