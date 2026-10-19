const TOKEN_URL = 'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal';

export async function getTenantAccessToken(appId:string,appSecret:string):Promise<string>{
    const response = await fetch (TOKEN_URL,{
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

function tokenError(code:unknown,msg:unknown):Error{
    return new Error(`Feishu token request failed:${code} msg=${msg}`);
}