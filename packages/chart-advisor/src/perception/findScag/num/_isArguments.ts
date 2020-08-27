import { tagTester } from './_isFunction';
import { has } from './defaultFunc';

let isArguments = tagTester('Arguments');

// Define a fallback version of the method in browsers (ahem, IE < 9), where
// there isn't any inspectable "Arguments" type.
(function() {
  if (!isArguments('Arguments')) {
    isArguments = function(obj) {
      return has(obj, 'callee');
    };
  }
})();

/**
 * Returns true if object is an Arguments object.
 * @param object Check if this object is an Arguments object.
 * @return True if `object` is an Arguments object, otherwise false.
 **/
export default isArguments;
