// Update the renderLatex function to use our complex table renderer
export const renderLatexWithFallback = (latex, isInline = false) => {
  if (!latex) return '';

  try {
    // First check if this is a complex table that needs special handling
    const complexTableElement = renderComplexTable(latex);
    if (complexTableElement) {
      return complexTableElement;
    }

    // Continue with the regular KaTeX rendering
    const html = katex.renderToString(latex, {
      displayMode: !isInline,
      throwOnError: false,
      trust: true,
      strict: false,
    });
    
    return html;
  } catch (error) {
    console.error('Error rendering LaTeX:', error);
    return isInline ? `$${latex}$` : `$$${latex}$$`;
  }
}; 