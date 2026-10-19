
export function parseBitableUrl(input: string): { appToken: string; tableId: string } {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    const baseIndex = parts.indexOf('base');
    const appToken = baseIndex !== -1 && parts[baseIndex + 1] ? parts[baseIndex + 1] : null;
    const tableId = url.searchParams.get('table') ??'';
    if(!appToken || !tableId){
        throw new Error(`Invalid Feishu Bitable URL: ${input}`);
    }

    return { appToken, tableId};

}

export function resolveBitableTable(options:{
    url?:string;
    appToken?:string;
    tableId?:string;
}):{appToken:string;tableId:string}{
    const parsed = options.url ? parseBitableUrl(options.url) : undefined;
    if(parsed && options.appToken && options.appToken !== parsed.appToken){
        throw new Error(`Feishu Bitable appToken does not match url: ${options.url}`);
    }
    if(parsed && options.tableId && options.tableId !== parsed.tableId){
        throw new Error(`Feishu Bitable tableId does not match url: ${options.url}`);
    }
    const appToken = options.appToken ?? parsed?.appToken;
    const tableId = options.tableId ?? parsed?.tableId;
    if(!appToken || !tableId){
        throw new Error(`Feishu Bitable url or appToken/tableId must be provided`);
    }
    return { appToken, tableId };
}