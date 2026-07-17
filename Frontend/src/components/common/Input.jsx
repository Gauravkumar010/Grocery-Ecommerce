// src/components/common/Input.jsx

import { forwardRef } from 'react';

const Input = forwardRef(({ label, error, type = 'text', className = '', ...rest }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`input-field ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;