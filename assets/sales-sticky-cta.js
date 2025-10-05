/**
 * Sales Sticky CTA
 * セクション略称: sscta
 *
 * 機能:
 * - スクロールで下部固定バーを表示/非表示
 * - カスタムイベント発火（config_open等）
 * - アンカーリンク対応
 * - ローカルストレージで閉じた状態を記憶
 */

class SalesStickyCTA {
  constructor(element) {
    this.element = element;
    this.scrollThreshold = parseInt(element.dataset.scrollThreshold) || 300;
    this.primaryEvent = element.dataset.primaryEvent || '';
    this.secondaryEvent = element.dataset.secondaryEvent || '';
    this.storageKey = 'eg_sscta_hidden';
    this.isScrolling = false;
    this.isUserHidden = false;

    this.init();
  }

  init() {
    // ローカルストレージチェック（ユーザーが閉じた履歴）
    this.checkStorage();

    // イベントリスナー設定
    this.attachEventListeners();

    // 初期スクロール位置チェック
    this.handleScroll();
  }

  checkStorage() {
    const hidden = sessionStorage.getItem(this.storageKey);
    if (hidden === 'true') {
      this.isUserHidden = true;
      this.element.classList.add('is-hidden');
    }
  }

  attachEventListeners() {
    // スクロールイベント（パフォーマンス最適化: throttle）
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    // 主要CTAクリック
    const primaryBtn = this.element.querySelector('[data-eg-sscta-primary]');
    if (primaryBtn) {
      primaryBtn.addEventListener('click', (e) => {
        this.handlePrimaryClick(e, primaryBtn);
      });
    }

    // 副CTAクリック
    const secondaryBtn = this.element.querySelector('[data-eg-sscta-secondary]');
    if (secondaryBtn) {
      secondaryBtn.addEventListener('click', (e) => {
        this.handleSecondaryClick(e, secondaryBtn);
      });
    }

    // 閉じるボタン
    const closeBtn = this.element.querySelector('[data-eg-sscta-close]');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide(true);
      });
    }

    // ウィンドウリサイズ
    window.addEventListener('resize', () => {
      this.handleResize();
    }, { passive: true });
  }

  handleScroll() {
    // ユーザーが閉じた場合は表示しない
    if (this.isUserHidden) return;

    const scrollY = window.scrollY || window.pageYOffset;

    if (scrollY >= this.scrollThreshold) {
      this.show();
    } else {
      this.hide(false);
    }
  }

  show() {
    if (!this.element.classList.contains('is-visible')) {
      this.element.classList.remove('is-hidden');
      this.element.classList.add('is-visible');

      // アナウンス（アクセシビリティ）
      this.announce('Call to action buttons are now available');
    }
  }

  hide(userAction = false) {
    if (this.element.classList.contains('is-visible')) {
      this.element.classList.remove('is-visible');
      this.element.classList.add('is-hidden');

      // ユーザーが閉じた場合はセッションに保存
      if (userAction) {
        this.isUserHidden = true;
        sessionStorage.setItem(this.storageKey, 'true');
        this.announce('Call to action buttons hidden');
      }
    }
  }

  handlePrimaryClick(e, btn) {
    const href = btn.getAttribute('href');

    // カスタムイベント発火
    if (this.primaryEvent) {
      e.preventDefault();
      this.dispatchCustomEvent(this.primaryEvent, {
        source: 'sales-sticky-cta',
        action: 'primary',
        href: href
      });

      // アンカーリンクの場合はスムーススクロール
      if (href && href.startsWith('#')) {
        this.scrollToAnchor(href);
      } else if (href && href !== '#') {
        // 外部リンクの場合は遅延して遷移
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      }
    } else if (href && href.startsWith('#')) {
      // イベントなし、アンカーリンクのみ
      e.preventDefault();
      this.scrollToAnchor(href);
    }

    // Analytics tracking
    this.trackEvent('primary_cta_click', {
      label: btn.textContent.trim(),
      href: href
    });
  }

  handleSecondaryClick(e, btn) {
    const href = btn.getAttribute('href');

    // カスタムイベント発火
    if (this.secondaryEvent) {
      e.preventDefault();
      this.dispatchCustomEvent(this.secondaryEvent, {
        source: 'sales-sticky-cta',
        action: 'secondary',
        href: href
      });

      if (href && href.startsWith('#')) {
        this.scrollToAnchor(href);
      } else if (href && href !== '#') {
        setTimeout(() => {
          window.location.href = href;
        }, 300);
      }
    } else if (href && href.startsWith('#')) {
      e.preventDefault();
      this.scrollToAnchor(href);
    }

    // Analytics tracking
    this.trackEvent('secondary_cta_click', {
      label: btn.textContent.trim(),
      href: href
    });
  }

  scrollToAnchor(href) {
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const offset = 80; // ヘッダー高さ分のオフセット
      const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }

  dispatchCustomEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
      bubbles: true,
      cancelable: true,
      detail: detail
    });

    document.dispatchEvent(event);

    // デバッグログ
    if (window.Shopify && window.Shopify.designMode) {
      console.log(`[Sales Sticky CTA] Event dispatched: ${eventName}`, detail);
    }
  }

  trackEvent(action, data = {}) {
    // Google Analytics / Shopify Analytics
    if (typeof window.gtag === 'function') {
      window.gtag('event', action, {
        event_category: 'sales_sticky_cta',
        ...data
      });
    }

    // Shopify Analytics
    if (window.ShopifyAnalytics && window.ShopifyAnalytics.lib && window.ShopifyAnalytics.lib.track) {
      window.ShopifyAnalytics.lib.track(action, data);
    }
  }

  handleResize() {
    // リサイズ時の処理（必要に応じて）
  }

  announce(message) {
    // スクリーンリーダー用のライブリージョン
    const liveRegion = document.querySelector('[role="status"]') || this.createLiveRegion();
    liveRegion.textContent = message;

    // 3秒後にクリア
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 3000);
  }

  createLiveRegion() {
    const region = document.createElement('div');
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.position = 'absolute';
    region.style.left = '-10000px';
    region.style.width = '1px';
    region.style.height = '1px';
    region.style.overflow = 'hidden';
    document.body.appendChild(region);
    return region;
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  const stickyCTAElements = document.querySelectorAll('.eg-sscta');

  stickyCTAElements.forEach(element => {
    new SalesStickyCTA(element);
  });
});

// Shopify Theme Editor対応
if (window.Shopify && window.Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => {
    const stickyCTA = event.target.querySelector('.eg-sscta');
    if (stickyCTA) {
      new SalesStickyCTA(stickyCTA);
    }
  });

  document.addEventListener('shopify:section:unload', (event) => {
    // クリーンアップ処理（必要に応じて）
  });
}
