
export function parseBitableUrl(input: string): { appToken: string; tableId: string } {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    const baseIndex = parts.indexOf('base');
    const appToken = baseIndex !== -1 && parts[baseIndex + 1] ? parts[baseIndex + 1] : null;
    const tableId = url.searchParams.get('table') ;
    if(!appToken || !tableId){
        throw new Error(`Invalid Feishu Bitable URL: ${input}`);
    }

    return { appToken, tableId};


}