import React from 'react';
import PropTypes from 'prop-types';

/**
 * Badge component following Untitled UI design principles
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Badge variant ('primary', 'gray', 'error', 'warning', 'success')
 * @param {string} props.size - Badge size ('sm', 'md')
 * @param {React.ReactNode} props.leftIcon - Icon to display on the left
 * @param {React.ReactNode} props.rightIcon - Icon to display on the right
 * @param {React.ReactNode} props.children - Badge content
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  className = '',
  ...rest
}) => {
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-50 text-primary-700 border border-primary-200',
    gray: 'bg-gray-100 text-gray-700 border border-gray-200',
    error: 'bg-error-50 text-error-700 border border-error-200',
    warning: 'bg-warning-50 text-warning-700 border border-warning-200',
    success: 'bg-success-50 text-success-700 border border-success-200'
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5'
  };
  
  // Combine all classes
  const badgeClasses = `
    inline-flex items-center font-medium rounded-full
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${className}
  `.trim();
  
  return (
    <span className={badgeClasses} {...rest}>
      {leftIcon && <span className="mr-1.5 -ml-0.5">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-1.5 -mr-0.5">{rightIcon}</span>}
    </span>
  );
};

Badge.propTypes = {
  variant: PropTypes.oneOf(['primary', 'gray', 'error', 'warning', 'success']),
  size: PropTypes.oneOf(['sm', 'md']),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default Badge;
