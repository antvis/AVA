import { getTenantAccessToken } from "./token";
import { convertRecord,FeishuFieldType } from "./convert";

import type { FeishuCell,FeishuField } from "./convert";
import type { FeishuBitableSourceOptions } from "../../../types";

function tableUrl(options:FeishuBitableSourceOptions,suffix:string):string{
    return `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(options.appToken)}/tables/${encodeURIComponent(options.tableId)}${suffix}`;
}

async function getItem(token:string,url:string):Promise<any[]>{
    const response = await fetch(url,{
        method:'GET',
        headers:{
            'Authorization':`Bearer ${token}`
        }
    });
    const body = await response.json();
    if(body.code !== 0) throw new Error(`Feishu API error ${body.code}:${body.msg}`);
    return body.data?.items??[];

}

export async function readTable(options:FeishuBitableSourceOptions):Promise<Record<string,FeishuCell>[]>{
    const token = await getTenantAccessToken(options.appId,options.appSecret);
    const fieldsItems = await getItem(token,tableUrl(options,'/fields'));
    const fields:FeishuField[] = fieldsItems
        .filter((field)=>field.type === FeishuFieldType.Text || field.type === FeishuFieldType.Number || field.type === FeishuFieldType.DateTime)
        .map((field)=>({name:field.field_name,type:field.type}));
    const records = await getItem(token,tableUrl(options,'/records'));
    return records.map((record)=>convertRecord(fields,record.fields));
}
