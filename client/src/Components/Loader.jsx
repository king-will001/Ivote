import React from 'react';

const Loader = ({
  label = 'Loading...',
  size = 'md',
  inline = false,
  fullPage = false,
  className = '',
  variant = 'default',
}) => {
  const sizeClass = size === 'sm' ? 'loader--sm' : size === 'lg' ? 'loader--lg' : 'loader--md';
  const inlineClass = inline && !fullPage ? 'loader--inline' : '';
  const fullPageClass = fullPage ? 'loader--fullscreen' : '';
  const variantClass = variant !== 'default' ? `loader--${variant}` : '';
  const classes = ['loader', sizeClass, inlineClass, fullPageClass, variantClass, className]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className={classes} role="status" aria-live="polite" aria-label={label}>
      <div className="loader_spinner" aria-hidden="true">
        <div className="loader_ring loader_ring-1" />
        <div className="loader_ring loader_ring-2" />
        <div className="loader_ring loader_ring-3" />
      </div>
      {label && <span className="loader_label">{label}</span>}
      {!inline && <div className="loader_bar" aria-hidden="true"><span /></div>}
    </div>
  );

  if (fullPage) {
    return <div className="loader_overlay">{content}</div>;
  }

  return content;
};

export default Loader;
