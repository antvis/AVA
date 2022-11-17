/** connect cls, remove empty */
export function classnames(...cls: string[]) {
  return cls.reduce((prev, curr) => (curr ? `${prev} ${curr}` : prev), '');
}
