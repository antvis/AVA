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
    const body = await response.json();
    if(body.code !== 0 || !body.tenant_access_token){
        throw new Error(`Feishu token request failed: ${body.code}:${body.msg}`);
    }
    return body.tenant_access_token;
}