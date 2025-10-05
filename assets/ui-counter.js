/**
 * UI Counter - Animated Counter with IntersectionObserver
 * - Counts up when element enters viewport
 * - Uses Intl.NumberFormat for proper formatting
 */

(function() {
  'use strict';

  class EgCounter {
    constructor(element) {
      this.element = element;
      this.valueElement = element.querySelector('[data-counter-value]');

      this.start = parseFloat(element.getAttribute('data-start')) || 0;
      this.end = parseFloat(element.getAttribute('data-end')) || 100;
      this.duration = parseFloat(element.getAttribute('data-duration')) || 2000;
      this.prefix = element.getAttribute('data-prefix') || '';
      this.suffix = element.getAttribute('data-suffix') || '';
      this.locale = element.getAttribute('data-locale') || 'ja-JP';
      this.separator = element.getAttribute('data-separator') !== 'false';

      this.current = this.start;
      this.hasAnimated = false;

      this.formatter = new Intl.NumberFormat(this.locale, {
        useGrouping: this.separator,
        maximumFractionDigits: this.getDecimalPlaces(this.end)
      });

      this.init();
    }

    init() {
      // Set initial value
      this.updateDisplay(this.start);

      // Setup IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && !this.hasAnimated) {
              this.animate();
            }
          });
        },
        {
          threshold: 0.5,
          rootMargin: '0px'
        }
      );

      observer.observe(this.element);
    }

    getDecimalPlaces(num) {
      const match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
      if (!match) return 0;
      return Math.max(
        0,
        (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0)
      );
    }

    animate() {
      this.hasAnimated = true;
      this.element.setAttribute('data-counting', 'true');

      const startTime = performance.now();
      const range = this.end - this.start;

      const step = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / this.duration, 1);

        // Easing function (easeOutCubic)
        const eased = 1 - Math.pow(1 - progress, 3);

        this.current = this.start + (range * eased);
        this.updateDisplay(this.current);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          this.updateDisplay(this.end);
          this.element.setAttribute('data-counting', 'false');
        }
      };

      requestAnimationFrame(step);
    }

    updateDisplay(value) {
      const formatted = this.formatter.format(value);
      this.valueElement.textContent = this.prefix + formatted + this.suffix;
    }
  }

  // Initialize all counters
  function initCounters() {
    const counters = document.querySelectorAll('[data-eg-counter]');
    counters.forEach(counter => {
      if (!counter.egCounterInstance) {
        counter.egCounterInstance = new EgCounter(counter);
      }
    });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCounters);
  } else {
    initCounters();
  }

  // Re-init on Shopify section load
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', initCounters);
  }
})();
