export type FeishuCell = string | number | boolean | null;

export function asString(value:unknown): string | null{
    if(typeof value === 'string') return value ==='' ? null:value;
    if(typeof value === 'number') return String(value);
    if(typeof value === 'boolean') return value ? 'true':'false';
    return null;
}

function textOf(segment:unknown):string{
    if(typeof segment === 'string') return segment;
    if(segment && typeof segment === 'object'){
        const text = (segment as {text?:unknown}).text;
        if(typeof text === 'string') return text;
    }
    return '';
}

export function asText(value:unknown):string | null{
    if(!Array.isArray(value)) return asString(value);
    const text = value
        .map((segment)=>textOf(segment))
        .join('')
        .trim();
    return text === '' ? null : text;

}

export function asNumber(value:unknown):number | null{
    if (value === null || value === undefined) return null;
    // 飞书数字字段可能返回 number，也可能返回字符串（如 "100"）
    if (typeof value === 'string' && value.trim() === '') return null;
    const number = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(number) ? number : null;
}

export function asTimestamp(value:unknown):string | null{
    const ms = asNumber(value);
    if (ms === null) return null;
    const date = new Date(ms);
    // 超出 Date 可表示范围时 getTime() 为 NaN，此时 toISOString() 会抛错
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
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



