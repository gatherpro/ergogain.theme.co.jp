/**
 * Sales Assurance Section - Dedicated JavaScript
 * セクション略称: sa (sales-assurance)
 * 名前空間: eg-sa-*
 *
 * 機能:
 * - FAQ アコーディオンのアクセシビリティ拡張
 * - aria-expanded 属性の動的更新
 * - キーボード操作対応（Space/Enter）
 */

(function() {
  'use strict';

  /**
   * Initialize FAQ accordion accessibility
   */
  function initFAQAccessibility() {
    const faqItems = document.querySelectorAll('.eg-sa__faq-item');

    if (!faqItems.length) return;

    faqItems.forEach(item => {
      const summary = item.querySelector('.eg-sa__faq-question');
      if (!summary) return;

      // Set initial aria-expanded
      updateAriaExpanded(item, summary);

      // Listen to toggle events
      item.addEventListener('toggle', () => {
        updateAriaExpanded(item, summary);
      });

      // Keyboard support (Space/Enter)
      summary.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          item.open = !item.open;
        }
      });
    });
  }

  /**
   * Update aria-expanded attribute
   * @param {HTMLDetailsElement} item - FAQ item
   * @param {HTMLElement} summary - Summary element
   */
  function updateAriaExpanded(item, summary) {
    const isOpen = item.hasAttribute('open');
    summary.setAttribute('aria-expanded', isOpen.toString());
  }

  /**
   * Track FAQ interactions (optional analytics)
   */
  function trackFAQInteraction(question) {
    // Optional: Send analytics event
    if (window.gtag) {
      window.gtag('event', 'faq_interaction', {
        event_category: 'sales_assurance',
        event_label: question
      });
    }

    // Optional: Send to Shopify analytics
    if (window.ShopifyAnalytics) {
      window.ShopifyAnalytics.lib.track('FAQ Opened', {
        section: 'sales_assurance',
        question: question
      });
    }
  }

  /**
   * Add analytics tracking to FAQ items
   */
  function initFAQTracking() {
    const faqItems = document.querySelectorAll('.eg-sa__faq-item');

    faqItems.forEach(item => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          const summary = item.querySelector('.eg-sa__faq-question-text');
          if (summary) {
            trackFAQInteraction(summary.textContent.trim());
          }
        }
      });
    });
  }

  /**
   * Close other FAQ items when one is opened (accordion behavior)
   * Optional: Uncomment if you want only one FAQ open at a time
   */
  function initAccordionBehavior() {
    const faqItems = document.querySelectorAll('.eg-sa__faq-item');

    faqItems.forEach(item => {
      item.addEventListener('toggle', () => {
        if (item.open) {
          // Close all other items
          faqItems.forEach(otherItem => {
            if (otherItem !== item && otherItem.open) {
              otherItem.open = false;
            }
          });
        }
      });
    });
  }

  /**
   * Initialize on DOM ready
   */
  function init() {
    initFAQAccessibility();
    initFAQTracking();
    // initAccordionBehavior(); // Uncomment for single-open behavior
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-initialize on Shopify section editor events
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', init);
    document.addEventListener('shopify:section:reorder', init);
  }

})();
