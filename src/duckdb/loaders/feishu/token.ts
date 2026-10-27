const FEISHU_ORIGIN = 'https://open.feishu.cn';
const larkHost = /(^|\.)larksuite\.com$/;

export function feishuOrigin(url?:string):string{
    if(!url || !/^https?:\/\//i.test(url))return FEISHU_ORIGIN;
    const host = new URL(url).hostname.toLowerCase();
    return larkHost.test(host)?'https://open.larksuite.com':FEISHU_ORIGIN;
}

export function feishuError(code:unknown,msg:unknown):Error{
    return new Error(`Feishu Error ${code}: ${msg}`);
}

export async function getTenantAccessToken(appId:string,appSecret:string,origin=FEISHU_ORIGIN):Promise<string>{
    const response = await fetch (`${origin}/open-apis/auth/v3/tenant_access_token/internal`,{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body: JSON.stringify({
            app_id:appId,
            app_secret:appSecret
        })
    });
    let body: unknown;
    try{
        body = await response.json();
    }catch{
        throw feishuError(undefined,'response is not JSON');
    }
    if(!body || typeof body !== 'object'){
        throw feishuError(undefined,'response is not JSON');
    }
    const payload = body as {code?:unknown;msg?:unknown;tenant_access_token?:unknown};
    if(payload.code !==0 || typeof payload.tenant_access_token !== 'string'||!payload.tenant_access_token){
        throw feishuError(payload.code,payload.msg);
    }
    return payload.tenant_access_token;
}
