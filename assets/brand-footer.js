/**
 * Brand Footer - Mobile Accordion
 * Handles accordion functionality for mobile navigation
 */

(function() {
  'use strict';

  const initAccordion = () => {
    // Only run on mobile screens
    if (window.innerWidth > 749) {
      return;
    }

    const columns = document.querySelectorAll('.brand-footer__column');

    columns.forEach(column => {
      const title = column.querySelector('.brand-footer__column-title');

      if (!title) return;

      // Remove existing event listeners
      const newTitle = title.cloneNode(true);
      title.parentNode.replaceChild(newTitle, title);

      // Add click handler
      newTitle.addEventListener('click', () => {
        const isOpen = column.classList.contains('is-open');

        // Close all other columns
        columns.forEach(col => {
          if (col !== column) {
            col.classList.remove('is-open');
          }
        });

        // Toggle current column
        if (isOpen) {
          column.classList.remove('is-open');
        } else {
          column.classList.add('is-open');
        }
      });
    });
  };

  // Auto-submit locale/country selector forms
  const initLocaleSelectors = () => {
    const selectors = document.querySelectorAll('.brand-footer__locale-select');

    selectors.forEach(select => {
      select.addEventListener('change', (e) => {
        const form = e.target.closest('form');
        if (form) {
          form.submit();
        }
      });
    });
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initAccordion();
      initLocaleSelectors();
    });
  } else {
    initAccordion();
    initLocaleSelectors();
  }

  // Re-initialize accordion on window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      initAccordion();
    }, 250);
  });

})();
