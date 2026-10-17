import { getTenantAccessToken } from "./token";
import { convertRecord,FeishuFieldType } from "./convert";

import type { FeishuCell,FeishuField } from "./convert";
import type { FeishuBitableSourceOptions } from "../../../types";

function tableUrl(table:{appToken:string;tableId:string},suffix:string):string{
    return  `https://open.feishu.cn/open-apis/bitable/v1/apps/${encodeURIComponent(table.appToken)}/tables/${encodeURIComponent(table.tableId)}${suffix}`
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

const RECORDS_PAGE_SIZE = 500;

async function getAllItems(token:string,url:string,pageSize:number):Promise<any[]>{
    const items:any[] = [];
    const seen = new Set<string>();
    let pageToken = '';
    do {
        const query = `page_size=${pageSize}${pageToken ? `&page_token=${encodeURIComponent(pageToken)}` : ''}`;
        const response = await fetch(`${url}?${query}`,{
            method:'GET',
            headers:{
                'Authorization':`Bearer ${token}`
            }
        });
        const body = await response.json();
        if(body.code !== 0) throw new Error(`Feishu API error ${body.code}:${body.msg}`);
        items.push(...(body.data?.items??[]));
        const hasMore = body.data?.has_more === true;
        pageToken = hasMore ? body.data?.page_token ?? '' : '';
        if(hasMore && !pageToken) throw new Error('Feishu pagination returned has_more without page_token');
        if(pageToken){
            if(seen.has(pageToken)) throw new Error('Feishu pagination returned a repeated page_token');
            seen.add(pageToken);
        }
    } while(pageToken);
    return items;
}

export async function readTable(options:FeishuBitableSourceOptions):Promise<Record<string,FeishuCell>[]>{
    const token = await getTenantAccessToken(options.appId,options.appSecret);
    
    const table = {appToken:options.appToken,tableId:options.tableId};
    const fieldsItems = await getItem(token,tableUrl(table,'/fields'));
    const fields:FeishuField[] = fieldsItems
        .filter((field)=>field.type === FeishuFieldType.Text || field.type === FeishuFieldType.Number || field.type === FeishuFieldType.DateTime)
        .map((field)=>({name:field.field_name,type:field.type}));
    const records = await getAllItems(token,tableUrl(table,'/records'),RECORDS_PAGE_SIZE);
    return records.map((record)=>convertRecord(fields,record.fields));
}
