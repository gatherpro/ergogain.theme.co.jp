/**
 * UI Meter - Animated Progress Meter
 * - IntersectionObserver trigger
 * - Smooth width animation
 */

(function() {
  'use strict';

  class EgMeter {
    constructor(element) {
      this.element = element;
      this.fill = element.querySelector('.eg-ui-meter__fill');
      this.hasAnimated = false;
      this.init();
    }

    init() {
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

    animate() {
      this.hasAnimated = true;
      const targetWidth = this.fill.getAttribute('data-meter-target-width');

      requestAnimationFrame(() => {
        this.fill.style.width = targetWidth + '%';
      });
    }
  }

  // Initialize all meters
  function initMeters() {
    const meters = document.querySelectorAll('[data-eg-meter]');
    meters.forEach(meter => {
      if (!meter.egMeterInstance) {
        meter.egMeterInstance = new EgMeter(meter);
      }
    });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMeters);
  } else {
    initMeters();
  }

  // Re-init on Shopify section load
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', initMeters);
  }
})();
