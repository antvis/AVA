/** connect cls, remove empty */
export const classnames = (...cls: string[]) => cls.reduce((prev, curr) => (curr ? `${prev} ${curr}` : prev), '');
