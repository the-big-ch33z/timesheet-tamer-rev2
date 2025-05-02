
// This file provides a fallback for any missing react-is functions
import React from 'react';

// Check if the native isFragment exists, if not provide a fallback
export const isFragment = (element: any): boolean => {
  // Try to use the built-in isFragment if it exists
  try {
    // Dynamically import react-is (this will be a runtime check)
    const reactIs = require('react-is');
    if (typeof reactIs.isFragment === 'function') {
      return reactIs.isFragment(element);
    }
  } catch (e) {
    console.debug('react-is isFragment not available, using fallback');
  }

  // Fallback implementation: check if the element is a fragment
  return (
    element !== null &&
    typeof element === 'object' &&
    element.type === React.Fragment
  );
};

// Export other common react-is functions that might be needed
export const isElement = (element: any): boolean => {
  return React.isValidElement(element);
};

export const isForwardRef = (element: any): boolean => {
  return (
    element !== null &&
    typeof element === 'object' &&
    element.$$typeof === Symbol.for('react.forward_ref')
  );
};
