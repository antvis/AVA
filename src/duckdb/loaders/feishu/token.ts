const FEISHU_ORIGIN = 'https://open.feishu.cn';
const larkHost = /(^|\.)larksuite\.com$/;

export function feishuOrigin(url?:string):string{
    if(!url || !/^https?:\/\//i.test(url))return FEISHU_ORIGIN;
    const host = new URL(url).hostname.toLowerCase();
    return larkHost.test(host)?'https://open.larksuite.com':FEISHU_ORIGIN;
}

export function feishuError(code:unknown,msg:unknown):Error{
    const id = Number(code);
    if(id === 91402){
        return new Error(`Feishu Error 91402: ${msg}.This table exists but you are not authorized to access it. Please check your app permissions and the table's sharing settings.`);
    }
    if (id===10003){
        return new Error(`Feishu Error 10003: ${msg}. This app is not authorized to access the Feishu API. please check your appId and appSecret or update ~/.ava/feishu.json.`);
    }
    if (id===21001){
        return new Error(`Feishu Error 21001: ${msg}. The Feishu Open Platform denied this app by platform policy, so it cannot obtain a tenant_access_token. This usually means the app was created from a personal account that is not allowed to call the Open Platform, for example an app created by signing in to open.feishu.cn with a Doubao account. Create the app with a Feishu account bound to a phone number (a normal self-built app), then update ~/.ava/feishu.json.`);
    }
    return new Error(`Feishu Error ${code}: ${msg}.please check your permissions or this table Url.`);
}

function tokenError(code:unknown,msg:unknown):Error{
    return feishuError(code,msg);
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
        throw tokenError(undefined,'response is not JSON');
    }
    if(!body || typeof body !== 'object'){
        throw tokenError(undefined,'response is not JSON');
    }
    const payload = body as {code?:unknown;msg?:unknown;tenant_access_token?:unknown};
    if(payload.code !==0 || typeof payload.tenant_access_token !== 'string'||!payload.tenant_access_token){
        throw tokenError(payload.code,payload.msg);
    }
    return payload.tenant_access_token;
}
