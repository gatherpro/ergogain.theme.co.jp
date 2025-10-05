/**
 * Sales Hero - JavaScript
 * - モーダル起動（event=config_open）
 * - A/B切替トラッキング
 */

class SalesHero {
  constructor() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.trackABVariant();
  }

  /**
   * イベントバインド
   */
  bindEvents() {
    // Primary CTA: 計測モーダル起動
    const configTriggers = document.querySelectorAll('[data-config-open]');
    configTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        this.openConfigModal(e);
      });

      // キーボードアクセシビリティ
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openConfigModal(e);
        }
      });
    });
  }

  /**
   * 計測モーダル起動
   * @param {Event} e
   */
  openConfigModal(e) {
    e.preventDefault();

    // カスタムイベント発火
    const event = new CustomEvent('config_open', {
      bubbles: true,
      detail: {
        source: 'sales_hero',
        timestamp: Date.now()
      }
    });
    document.dispatchEvent(event);

    // Analytics トラッキング（GTM/GA4対応）
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'config_open',
        event_category: 'engagement',
        event_label: 'sales_hero_cta',
        value: 1
      });
    }

    // コンソールログ（デバッグ用）
    console.log('[Sales Hero] Config modal open event triggered');

    // モーダル要素が存在する場合は直接開く
    const modal = document.querySelector('[data-config-modal]');
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');

      // フォーカス管理
      const firstFocusable = modal.querySelector('input, button, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    }
  }

  /**
   * A/Bバリアントトラッキング
   */
  trackABVariant() {
    const hero = document.querySelector('[data-ab-variant]');
    if (!hero) return;

    const variant = hero.getAttribute('data-ab-variant');

    // Analytics トラッキング
    if (window.dataLayer) {
      window.dataLayer.push({
        event: 'ab_test_view',
        ab_test_name: 'sales_hero_copy',
        ab_variant: variant,
        page_location: window.location.href
      });
    }

    // セッションストレージに保存（A/B一貫性確保）
    try {
      sessionStorage.setItem('sales_hero_variant', variant);
    } catch (e) {
      console.warn('[Sales Hero] sessionStorage not available');
    }

    console.log(`[Sales Hero] A/B Variant: ${variant}`);
  }
}

// DOMContentLoaded で初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new SalesHero();
  });
} else {
  new SalesHero();
}

// グローバルアクセス用（必要に応じて）
window.SalesHero = SalesHero;
