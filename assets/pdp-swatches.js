/**
 * PDP Swatches - Interactive color/material selector with preview integration
 */

class PDPSwatches {
  constructor(section) {
    this.section = section;
    this.reflectToUrl = section.dataset.reflectToUrl === 'true';
    this.targetSelector = section.dataset.targetSelector;
    this.groups = Array.from(section.querySelectorAll('.pdp-swatches__list-wrapper'));
    this.selectedValues = {};

    if (!this.section) return;

    this.init();
  }

  init() {
    this.setupSwatches();
    this.setupKeyboardNavigation();
    this.initializeFromUrl();
  }

  setupSwatches() {
    this.groups.forEach(group => {
      const attribute = group.dataset.attribute;
      const swatches = Array.from(group.querySelectorAll('.pdp-swatches__swatch'));

      swatches.forEach(swatch => {
        // Click handler
        swatch.addEventListener('click', (e) => {
          e.preventDefault();
          if (!swatch.disabled) {
            this.selectSwatch(swatch, attribute, group);
          }
        });

        // Store initial selection
        if (swatch.classList.contains('is-selected') && !swatch.disabled) {
          this.selectedValues[attribute] = {
            value: swatch.dataset.value,
            mediaId: swatch.dataset.mediaId
          };
        }
      });
    });
  }

  setupKeyboardNavigation() {
    this.groups.forEach(group => {
      const swatches = Array.from(group.querySelectorAll('.pdp-swatches__swatch:not([disabled])'));

      group.addEventListener('keydown', (e) => {
        const currentSwatch = e.target;
        if (!currentSwatch.classList.contains('pdp-swatches__swatch')) return;

        const currentIndex = swatches.indexOf(currentSwatch);
        let targetIndex = -1;

        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowDown':
            e.preventDefault();
            targetIndex = (currentIndex + 1) % swatches.length;
            break;
          case 'ArrowLeft':
          case 'ArrowUp':
            e.preventDefault();
            targetIndex = (currentIndex - 1 + swatches.length) % swatches.length;
            break;
          case 'Home':
            e.preventDefault();
            targetIndex = 0;
            break;
          case 'End':
            e.preventDefault();
            targetIndex = swatches.length - 1;
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            if (!currentSwatch.disabled) {
              this.selectSwatch(currentSwatch, group.dataset.attribute, group);
            }
            return;
        }

        if (targetIndex !== -1 && swatches[targetIndex]) {
          swatches[targetIndex].focus();
          this.selectSwatch(swatches[targetIndex], group.dataset.attribute, group);
        }
      });
    });
  }

  selectSwatch(swatch, attribute, group) {
    if (swatch.disabled) return;

    // Remove previous selection in this group
    const allSwatches = group.querySelectorAll('.pdp-swatches__swatch');
    allSwatches.forEach(s => {
      s.classList.remove('is-selected', 'is-selecting');
      s.setAttribute('aria-checked', 'false');
    });

    // Set new selection
    swatch.classList.add('is-selected', 'is-selecting');
    swatch.setAttribute('aria-checked', 'true');

    // Remove selecting animation class after animation
    setTimeout(() => {
      swatch.classList.remove('is-selecting');
    }, 300);

    // Store selected value
    const value = swatch.dataset.value;
    const mediaId = swatch.dataset.mediaId;

    this.selectedValues[attribute] = {
      value: value,
      mediaId: mediaId
    };

    // Update section data attributes
    this.section.dataset[`attr${this.toCamelCase(attribute)}`] = value;

    // Dispatch custom event for preview update
    this.dispatchSwatchChange(attribute, value, mediaId);

    // Update URL if enabled
    if (this.reflectToUrl) {
      this.updateUrl();
    }

    // Trigger preview update
    this.updatePreview(attribute, value, mediaId);
  }

  dispatchSwatchChange(attr, value, mediaId) {
    const event = new CustomEvent('eg:swatch-change', {
      detail: {
        attr: attr,
        value: value,
        mediaId: mediaId,
        allSelections: this.selectedValues
      },
      bubbles: true,
      cancelable: true
    });

    window.dispatchEvent(event);
  }

  updateUrl() {
    if (!this.reflectToUrl) return;

    const url = new URL(window.location);

    // Update or add query parameters
    Object.keys(this.selectedValues).forEach(attr => {
      url.searchParams.set(attr, this.selectedValues[attr].value);
    });

    // Update URL without reload
    window.history.replaceState({}, '', url);
  }

  initializeFromUrl() {
    if (!this.reflectToUrl) return;

    const url = new URL(window.location);

    this.groups.forEach(group => {
      const attribute = group.dataset.attribute;
      const urlValue = url.searchParams.get(attribute);

      if (urlValue) {
        const targetSwatch = group.querySelector(`[data-value="${urlValue}"]:not([disabled])`);
        if (targetSwatch) {
          this.selectSwatch(targetSwatch, attribute, group);
        }
      }
    });
  }

  updatePreview(attr, value, mediaId) {
    if (!this.targetSelector || !mediaId) return;

    const targetElement = document.querySelector(this.targetSelector);
    if (!targetElement) return;

    // Add loading state
    this.section.classList.add('is-loading');

    // Simulate preview update with timeout for smooth transition
    setTimeout(() => {
      // Dispatch event to target element
      const previewEvent = new CustomEvent('pdp:preview-update', {
        detail: {
          attribute: attr,
          value: value,
          mediaId: mediaId
        },
        bubbles: true
      });

      targetElement.dispatchEvent(previewEvent);

      // Remove loading state
      this.section.classList.remove('is-loading');
    }, 50);
  }

  toCamelCase(str) {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  }
}

// Initialize all PDP Swatches on the page
document.addEventListener('DOMContentLoaded', () => {
  const swatchSections = document.querySelectorAll('.pdp-swatches');
  swatchSections.forEach(section => new PDPSwatches(section));
});

// Re-initialize on Shopify section load (for theme editor)
if (typeof Shopify !== 'undefined' && Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    const section = event.target.querySelector('.pdp-swatches');
    if (section) {
      new PDPSwatches(section);
    }
  });
}

// Example: Listen to swatch changes globally
// window.addEventListener('eg:swatch-change', (e) => {
//   console.log('Swatch changed:', e.detail);
// });
