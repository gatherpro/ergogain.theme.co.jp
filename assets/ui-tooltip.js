/**
 * UI Tooltip - Accessible Tooltip Component
 * - Esc key to close
 * - Click outside to close
 * - ARIA support
 */

(function() {
  'use strict';

  class EgTooltip {
    constructor(trigger) {
      this.trigger = trigger;
      this.tooltipId = trigger.getAttribute('data-eg-tooltip-trigger');
      this.tooltip = document.getElementById(this.tooltipId);

      if (!this.tooltip) return;

      this.isOpen = false;
      this.init();
    }

    init() {
      // Hover events
      this.trigger.addEventListener('mouseenter', () => this.show());
      this.trigger.addEventListener('mouseleave', () => this.hide());

      // Focus events
      this.trigger.addEventListener('focus', () => this.show());
      this.trigger.addEventListener('blur', () => this.hide());

      // Click toggle
      this.trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });

      // Esc key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.hide();
          this.trigger.focus();
        }
      });

      // Click outside
      document.addEventListener('click', (e) => {
        if (this.isOpen && !this.trigger.contains(e.target) && !this.tooltip.contains(e.target)) {
          this.hide();
        }
      });
    }

    show() {
      this.tooltip.hidden = false;
      this.isOpen = true;
      this.trigger.setAttribute('aria-expanded', 'true');
    }

    hide() {
      this.tooltip.hidden = true;
      this.isOpen = false;
      this.trigger.setAttribute('aria-expanded', 'false');
    }

    toggle() {
      if (this.isOpen) {
        this.hide();
      } else {
        this.show();
      }
    }
  }

  // Initialize all tooltips
  function initTooltips() {
    const triggers = document.querySelectorAll('[data-eg-tooltip-trigger]');
    triggers.forEach(trigger => new EgTooltip(trigger));
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTooltips);
  } else {
    initTooltips();
  }

  // Re-init on Shopify section load (theme editor)
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', initTooltips);
  }
})();
