/**
 * Apple-Style Header JavaScript
 * - Handles scroll behavior for sticky header
 * - Search modal toggle
 * - Mobile menu drawer toggle
 * - Accessibility features
 */

(function() {
  'use strict';

  // ========== Scroll Behavior ==========
  function initScrollBehavior() {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    let lastScrollTop = 0;
    const scrollThreshold = 10;

    function handleScroll() {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (scrollTop > scrollThreshold) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }

      lastScrollTop = scrollTop;
    }

    // Throttle scroll event for performance
    let ticking = false;
    window.addEventListener('scroll', function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ========== Search Modal ==========
  function initSearchModal() {
    const searchToggle = document.querySelector('[data-search-toggle]');
    const searchModal = document.querySelector('[data-search-modal]');
    const searchClose = document.querySelector('[data-search-close]');
    const searchInput = document.querySelector('[data-search-input]');

    if (!searchToggle || !searchModal) return;

    function openSearch() {
      searchModal.removeAttribute('hidden');
      setTimeout(() => {
        searchModal.classList.add('active');
        if (searchInput) {
          searchInput.focus();
        }
      }, 10);
      document.body.style.overflow = 'hidden';
    }

    function closeSearch() {
      searchModal.classList.remove('active');
      setTimeout(() => {
        searchModal.setAttribute('hidden', '');
      }, 300);
      document.body.style.overflow = '';
    }

    searchToggle.addEventListener('click', openSearch);

    if (searchClose) {
      searchClose.addEventListener('click', closeSearch);
    }

    // Close on overlay click
    searchModal.addEventListener('click', function(e) {
      if (e.target === searchModal) {
        closeSearch();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !searchModal.hasAttribute('hidden')) {
        closeSearch();
      }
    });
  }

  // ========== Mobile Menu Drawer ==========
  function initMobileMenu() {
    const mobileMenuToggle = document.querySelector('[data-mobile-menu-toggle]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');
    const mobileMenuClose = document.querySelector('[data-mobile-menu-close]');
    const mobileMenuOverlay = document.querySelector('[data-mobile-menu-overlay]');

    if (!mobileMenuToggle || !mobileMenu) return;

    function openMenu() {
      mobileMenu.removeAttribute('hidden');
      setTimeout(() => {
        mobileMenu.classList.add('active');
        mobileMenuToggle.setAttribute('aria-expanded', 'true');
      }, 10);
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      mobileMenu.classList.remove('active');
      mobileMenuToggle.setAttribute('aria-expanded', 'false');
      setTimeout(() => {
        mobileMenu.setAttribute('hidden', '');
      }, 300);
      document.body.style.overflow = '';
    }

    mobileMenuToggle.addEventListener('click', function() {
      const isOpen = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener('click', closeMenu);
    }

    if (mobileMenuOverlay) {
      mobileMenuOverlay.addEventListener('click', closeMenu);
    }

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !mobileMenu.hasAttribute('hidden')) {
        closeMenu();
      }
    });

    // Close menu on window resize if it crosses the breakpoint
    let resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        if (window.innerWidth >= 990 && !mobileMenu.hasAttribute('hidden')) {
          closeMenu();
        }
      }, 250);
    });
  }

  // ========== Trap Focus in Modals ==========
  function trapFocus(container) {
    const focusableElements = container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    container.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });
  }

  // ========== Initialize ==========
  function init() {
    initScrollBehavior();
    initSearchModal();
    initMobileMenu();

    // Setup focus trapping for modals
    const searchModal = document.querySelector('[data-search-modal]');
    const mobileMenu = document.querySelector('[data-mobile-menu]');

    if (searchModal) {
      trapFocus(searchModal);
    }

    if (mobileMenu) {
      trapFocus(mobileMenu);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
