/**
 * UI Mini Chart - Animated SVG Charts
 * - Bar chart animation
 * - Meter chart animation
 * - IntersectionObserver trigger
 */

(function() {
  'use strict';

  class EgMiniChart {
    constructor(element) {
      this.element = element;
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

      // Bar chart animation
      const bar = this.element.querySelector('.eg-ui-mini-chart__bar');
      if (bar) {
        const targetWidth = bar.getAttribute('data-chart-target-width');
        requestAnimationFrame(() => {
          bar.setAttribute('width', targetWidth);
        });
      }

      // Meter chart animation
      const meter = this.element.querySelector('.eg-ui-mini-chart__meter');
      if (meter) {
        const targetOffset = meter.getAttribute('data-chart-target-offset');
        requestAnimationFrame(() => {
          meter.setAttribute('stroke-dashoffset', targetOffset);
        });
      }
    }
  }

  // Initialize all charts
  function initCharts() {
    const charts = document.querySelectorAll('[data-eg-chart]');
    charts.forEach(chart => {
      if (!chart.egChartInstance) {
        chart.egChartInstance = new EgMiniChart(chart);
      }
    });
  }

  // Init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }

  // Re-init on Shopify section load
  if (typeof Shopify !== 'undefined' && Shopify.designMode) {
    document.addEventListener('shopify:section:load', initCharts);
  }
})();
