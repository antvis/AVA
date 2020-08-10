import group from './group';
import { has } from './defaultFunc';

// Groups the object's values by a criterion. Pass either a string attribute
// to group by, or a function that returns the criterion.
export default group(function(result: any, value: any, key: any) {
  if (has(result, key)) result[key].push(value);
  else result[key] = [value];
});
