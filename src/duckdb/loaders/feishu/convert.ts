export type FeishuCell = string | number | boolean | null;

export function asString(value:unknown): string | null{
    if(typeof value === 'string') return value ==='' ? null:value;
    if(typeof value === 'number') return String(value);
    if(typeof value === 'boolean') return value ? 'true':'false';
    return null;
}

export function asText(value:unknown):string | null{
    if(!Array.isArray(value)) return asString(value);
    // todo:文本类型转换为字符串

    return null

}

export function asNumber(value:unknown):number | null{
    if (value == null || value ==='') return null;
    // todo:数字类型
    return null
}

export function asTimestamp(value:unknown):string | null{
    const ms = asNumber(value);
    return ms === null ? null : new Date(ms).toISOString();
}

export enum FeishuFieldType{
    Text = 1,
    Number = 2,
    DateTime = 5,
}

export function convertFieldValue(type: number,value:unknown): FeishuCell{
    switch(type){
        case FeishuFieldType.Text:
            return asText(value);
        case FeishuFieldType.Number:
            return asNumber(value);
        case FeishuFieldType.DateTime:
            return asTimestamp(value);
        default:
            throw new Error(`Unsupported field type: ${type}`);
    }
}

export interface FeishuField{
    name : string;
    type : number;
}


// 一行对象
export function convertRecord(fields: FeishuField[], record: Record<string, unknown>): Record<string, FeishuCell>{
    const row: Record<string, FeishuCell> = {};
    for(const field of fields){
        const value = record[field.name];
        row[field.name] = convertFieldValue(field.type,value);
    }
    return row;
}



