/**
 * Featured Slider - Apple-style horizontal scroll with keyboard support
 */

class FeaturedSlider {
  constructor(section) {
    this.section = section;
    this.track = section.querySelector('.featured-slider__track');
    this.prevButton = section.querySelector('.featured-slider__nav--prev');
    this.nextButton = section.querySelector('.featured-slider__nav--next');
    this.cards = Array.from(section.querySelectorAll('.featured-slider__card'));

    if (!this.track) return;

    this.init();
  }

  init() {
    this.setupNavigation();
    this.setupKeyboardControls();
    this.updateButtonStates();

    // Update button states on scroll
    this.track.addEventListener('scroll', () => {
      this.updateButtonStates();
    });

    // Update on resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.updateButtonStates();
      }, 150);
    });
  }

  setupNavigation() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.scrollPrev());
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.scrollNext());
    }
  }

  setupKeyboardControls() {
    if (this.prevButton) {
      this.prevButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.scrollPrev();
        }
      });
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.scrollNext();
        }
      });
    }

    // Arrow key navigation when track is focused
    this.track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.scrollPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        this.scrollNext();
      }
    });
  }

  scrollPrev() {
    const scrollAmount = this.getScrollAmount();
    this.track.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  }

  scrollNext() {
    const scrollAmount = this.getScrollAmount();
    this.track.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }

  getScrollAmount() {
    if (this.cards.length === 0) return 0;

    // Calculate scroll amount based on card width + gap
    const cardWidth = this.cards[0].offsetWidth;
    const gap = parseInt(getComputedStyle(this.track).gap) || 0;
    const visibleCards = Math.floor(this.track.offsetWidth / (cardWidth + gap));

    // Scroll by number of visible cards (minimum 1)
    return (cardWidth + gap) * Math.max(1, visibleCards);
  }

  updateButtonStates() {
    if (!this.prevButton || !this.nextButton) return;

    const scrollLeft = this.track.scrollLeft;
    const maxScroll = this.track.scrollWidth - this.track.offsetWidth;

    // Disable prev button at start
    if (scrollLeft <= 10) {
      this.prevButton.disabled = true;
      this.prevButton.setAttribute('aria-disabled', 'true');
    } else {
      this.prevButton.disabled = false;
      this.prevButton.setAttribute('aria-disabled', 'false');
    }

    // Disable next button at end
    if (scrollLeft >= maxScroll - 10) {
      this.nextButton.disabled = true;
      this.nextButton.setAttribute('aria-disabled', 'true');
    } else {
      this.nextButton.disabled = false;
      this.nextButton.setAttribute('aria-disabled', 'false');
    }
  }
}

// Initialize all featured sliders on the page
document.addEventListener('DOMContentLoaded', () => {
  const sliders = document.querySelectorAll('.featured-slider');
  sliders.forEach(slider => new FeaturedSlider(slider));
});

// Re-initialize on Shopify section load (for theme editor)
if (typeof Shopify !== 'undefined' && Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    const slider = event.target.querySelector('.featured-slider');
    if (slider) {
      new FeaturedSlider(slider);
    }
  });
}
