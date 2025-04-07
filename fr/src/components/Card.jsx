import React from 'react';
import PropTypes from 'prop-types';

/**
 * Card component following Untitled UI design principles
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.description - Card description
 * @param {React.ReactNode} props.children - Card content
 * @param {React.ReactNode} props.footer - Card footer content
 * @param {boolean} props.noPadding - Whether to remove padding from the card body
 * @param {string} props.className - Additional CSS classes
 */
const Card = ({
  title,
  description,
  children,
  footer,
  noPadding = false,
  className = '',
  ...rest
}) => {
  return (
    <div 
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
      {...rest}
    >
      {(title || description) && (
        <div className="px-6 py-5 border-b border-gray-200">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
      )}
      
      <div className={noPadding ? '' : 'p-6'}>
        {children}
      </div>
      
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.node,
  footer: PropTypes.node,
  noPadding: PropTypes.bool,
  className: PropTypes.string
};

export default Card;
