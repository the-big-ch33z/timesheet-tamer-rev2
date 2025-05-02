
// This file provides fallbacks for prop-types to resolve ESM/CJS compatibility issues

// Create a basic PropTypes object with common validators
const PropTypes = {
  array: createValidator('array'),
  bool: createValidator('boolean'),
  func: createValidator('function'),
  number: createValidator('number'),
  object: createValidator('object'),
  string: createValidator('string'),
  symbol: createValidator('symbol'),
  node: createValidator('node'),
  element: createValidator('element'),
  any: createValidator('any'),
  instanceOf: () => createValidator('instanceOf'),
  oneOf: () => createValidator('oneOf'),
  oneOfType: () => createValidator('oneOfType'),
  arrayOf: () => createValidator('arrayOf'),
  objectOf: () => createValidator('objectOf'),
  shape: () => createValidator('shape'),
  exact: () => createValidator('exact'),
};

// Helper to create validator functions
function createValidator(type: string) {
  const validator = function() { return null; };
  validator.isRequired = function() { return null; };
  return validator;
}

// Checks if a module exists
function moduleExists(name: string): boolean {
  try {
    return !!require.resolve(name);
  } catch (e) {
    return false;
  }
}

// Export the real prop-types if available, otherwise use our polyfill
let exportedPropTypes = PropTypes;

if (moduleExists('prop-types')) {
  try {
    // Try to load the real prop-types
    const realPropTypes = require('prop-types');
    exportedPropTypes = realPropTypes;
  } catch (e) {
    console.debug('Failed to load prop-types, using polyfill instead');
  }
}

// Add default export for ESM compatibility
export default exportedPropTypes;

// Also export named exports
export const array = exportedPropTypes.array;
export const bool = exportedPropTypes.bool;
export const func = exportedPropTypes.func;
export const number = exportedPropTypes.number;
export const object = exportedPropTypes.object;
export const string = exportedPropTypes.string;
export const symbol = exportedPropTypes.symbol;
export const any = exportedPropTypes.any;
export const node = exportedPropTypes.node;
export const element = exportedPropTypes.element;
export const instanceOf = exportedPropTypes.instanceOf;
export const oneOf = exportedPropTypes.oneOf;
export const oneOfType = exportedPropTypes.oneOfType;
export const arrayOf = exportedPropTypes.arrayOf;
export const objectOf = exportedPropTypes.objectOf;
export const shape = exportedPropTypes.shape;
export const exact = exportedPropTypes.exact;
