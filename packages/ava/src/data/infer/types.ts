export type MatchFunction = (input: Record<string, any> | Record<string, any>[]) => { is: boolean; format: any };
