/**
 * QuickView Modal - バリアント選択とカート追加
 * 依存: なし（バニラJS）
 * A11y: フォーカストラップ, Esc閉じ, ARIA属性
 */

class QuickView {
  constructor() {
    this.modal = document.querySelector('[data-quickview-modal]');
    if (!this.modal) return;

    this.backdrop = this.modal.querySelector('[data-quickview-close]');
    this.closeBtn = this.modal.querySelector('.eg-qv-close');
    this.content = this.modal.querySelector('[data-quickview-content]');
    this.form = this.modal.querySelector('[data-quickview-form]');

    // 製品データ
    this.productData = null;
    this.selectedColor = null;
    this.selectedSize = null;
    this.currentVariant = null;

    // フォーカストラップ用
    this.focusableElements = null;
    this.firstFocusable = null;
    this.lastFocusable = null;

    this.init();
  }

  init() {
    // QuickViewボタンのクリックイベント
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-quickview]');
      if (trigger) {
        e.preventDefault();
        const productUrl = trigger.dataset.productUrl;
        this.open(productUrl);
      }
    });

    // モーダルを閉じる
    this.modal.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-quickview-close')) {
        this.close();
      }
    });

    // Escキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.getAttribute('aria-hidden') === 'false') {
        this.close();
      }
    });

    // フォーム送信
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addToCart();
      });
    }

    // 数量ボタン
    const minusBtn = this.modal.querySelector('[data-quantity-minus]');
    const plusBtn = this.modal.querySelector('[data-quantity-plus]');
    const qtyInput = this.modal.querySelector('[data-quantity-input]');

    if (minusBtn && qtyInput) {
      minusBtn.addEventListener('click', () => {
        const current = parseInt(qtyInput.value) || 1;
        if (current > 1) qtyInput.value = current - 1;
      });
    }

    if (plusBtn && qtyInput) {
      plusBtn.addEventListener('click', () => {
        const current = parseInt(qtyInput.value) || 1;
        qtyInput.value = current + 1;
      });
    }
  }

  async open(productUrl) {
    try {
      // 製品データ取得
      const response = await fetch(productUrl);
      const product = await response.json();
      this.productData = product;

      // モーダルに製品情報を挿入
      this.renderProduct(product);

      // モーダルを表示
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      // フォーカストラップ設定
      this.setupFocusTrap();

      // 最初のフォーカス要素にフォーカス
      if (this.firstFocusable) {
        setTimeout(() => this.firstFocusable.focus(), 100);
      }

    } catch (error) {
      console.error('QuickView: Product fetch failed', error);
      this.showError('商品情報の取得に失敗しました');
    }
  }

  close() {
    this.modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // リセット
    this.selectedColor = null;
    this.selectedSize = null;
    this.currentVariant = null;
    this.productData = null;
  }

  renderProduct(product) {
    // タイトル
    const titleEl = this.modal.querySelector('[data-product-title]');
    if (titleEl) titleEl.textContent = product.title;

    // 価格
    const priceEl = this.modal.querySelector('[data-product-price]');
    if (priceEl) {
      const price = this.formatMoney(product.price);
      const comparePrice = product.compare_at_price_max > product.price
        ? this.formatMoney(product.compare_at_price_max)
        : null;

      if (comparePrice) {
        priceEl.innerHTML = `
          <span class="eg-qv-price-compare">${comparePrice}</span>
          <span class="eg-qv-price-sale">${price}</span>
        `;
      } else {
        priceEl.innerHTML = `<span class="eg-qv-price-regular">${price}</span>`;
      }
    }

    // 在庫状態
    const stockEl = this.modal.querySelector('[data-product-stock]');
    if (stockEl) {
      if (product.available) {
        stockEl.innerHTML = '<span class="eg-qv-stock-in">在庫あり</span>';
      } else {
        stockEl.innerHTML = '<span class="eg-qv-stock-out">在庫切れ</span>';
      }
    }

    // 商品詳細リンク
    const linkEl = this.modal.querySelector('[data-product-link]');
    if (linkEl) linkEl.href = `/products/${product.handle}`;

    // メイン画像
    const mainImageEl = this.modal.querySelector('[data-current-image]');
    if (mainImageEl && product.featured_image) {
      mainImageEl.src = product.featured_image;
      mainImageEl.alt = product.title;
    }

    // バリアント解析（option1=Color, option2=Size前提）
    this.renderVariants(product);
  }

  renderVariants(product) {
    const variants = product.variants;
    if (!variants || variants.length === 0) return;

    // オプション抽出
    const colors = [...new Set(variants.map(v => v.option1))].filter(Boolean);
    const sizes = [...new Set(variants.map(v => v.option2))].filter(Boolean);

    // カラースウォッチ
    const colorContainer = this.modal.querySelector('[data-color-swatches]');
    if (colorContainer && colors.length > 0) {
      colorContainer.innerHTML = '';
      colors.forEach((color, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'eg-qv-swatch';
        btn.dataset.color = color;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('aria-label', color);
        btn.textContent = color;

        btn.addEventListener('click', () => this.selectColor(color));
        colorContainer.appendChild(btn);
      });
    }

    // サイズボタン
    const sizeContainer = this.modal.querySelector('[data-size-buttons]');
    if (sizeContainer && sizes.length > 0) {
      sizeContainer.innerHTML = '';
      sizes.forEach((size) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'eg-qv-size-btn';
        btn.dataset.size = size;
        btn.setAttribute('role', 'radio');
        btn.setAttribute('aria-checked', 'false');
        btn.setAttribute('aria-label', size);
        btn.textContent = size;
        btn.disabled = true; // 色選択まで無効

        btn.addEventListener('click', () => this.selectSize(size));
        sizeContainer.appendChild(btn);
      });
    }
  }

  selectColor(color) {
    this.selectedColor = color;

    // UI更新
    const swatches = this.modal.querySelectorAll('[data-color]');
    swatches.forEach(sw => {
      const isSelected = sw.dataset.color === color;
      sw.classList.toggle('active', isSelected);
      sw.setAttribute('aria-checked', isSelected);
    });

    const selectedColorLabel = this.modal.querySelector('[data-selected-color]');
    if (selectedColorLabel) selectedColorLabel.textContent = color;

    // サイズボタンを有効化（該当する色のサイズのみ）
    const availableSizes = this.productData.variants
      .filter(v => v.option1 === color && v.available)
      .map(v => v.option2);

    const sizeButtons = this.modal.querySelectorAll('[data-size]');
    sizeButtons.forEach(btn => {
      const size = btn.dataset.size;
      const isAvailable = availableSizes.includes(size);
      btn.disabled = !isAvailable;
      btn.classList.toggle('disabled', !isAvailable);
    });

    // サイズ選択をリセット
    this.selectedSize = null;
    sizeButtons.forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-checked', 'false');
    });
    const selectedSizeLabel = this.modal.querySelector('[data-selected-size]');
    if (selectedSizeLabel) selectedSizeLabel.textContent = '-';

    // 画像更新（色に紐づく最初のバリアント）
    this.updateImage();

    // ATC無効化
    this.updateAddToCartButton();
  }

  selectSize(size) {
    this.selectedSize = size;

    // UI更新
    const sizeButtons = this.modal.querySelectorAll('[data-size]');
    sizeButtons.forEach(btn => {
      const isSelected = btn.dataset.size === size;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-checked', isSelected);
    });

    const selectedSizeLabel = this.modal.querySelector('[data-selected-size]');
    if (selectedSizeLabel) selectedSizeLabel.textContent = size;

    // バリアント確定
    this.currentVariant = this.productData.variants.find(
      v => v.option1 === this.selectedColor && v.option2 === this.selectedSize
    );

    // 画像更新
    this.updateImage();

    // ATC有効化
    this.updateAddToCartButton();
  }

  updateImage() {
    if (!this.selectedColor) return;

    // 色に基づく画像を取得
    const variant = this.productData.variants.find(
      v => v.option1 === this.selectedColor && v.featured_image
    );

    const mainImageEl = this.modal.querySelector('[data-current-image]');
    if (mainImageEl && variant && variant.featured_image) {
      mainImageEl.src = variant.featured_image.src;
      mainImageEl.alt = variant.name;
    }
  }

  updateAddToCartButton() {
    const btn = this.modal.querySelector('[data-add-to-cart]');
    const variantIdInput = this.modal.querySelector('[data-variant-id]');

    if (!btn) return;

    if (this.currentVariant && this.currentVariant.available) {
      btn.disabled = false;
      if (variantIdInput) variantIdInput.value = this.currentVariant.id;
    } else {
      btn.disabled = true;
      if (variantIdInput) variantIdInput.value = '';
    }
  }

  async addToCart() {
    if (!this.currentVariant) return;

    const btn = this.modal.querySelector('[data-add-to-cart]');
    const spinner = this.modal.querySelector('[data-spinner]');
    const buttonText = this.modal.querySelector('[data-button-text]');
    const qtyInput = this.modal.querySelector('[data-quantity-input]');
    const errorMsg = this.modal.querySelector('[data-error-message]');
    const successToast = this.modal.querySelector('[data-success-toast]');

    // ボタン無効化
    btn.disabled = true;
    if (spinner) spinner.hidden = false;
    if (buttonText) buttonText.textContent = '追加中...';
    if (errorMsg) errorMsg.hidden = true;

    try {
      const formData = {
        items: [
          {
            id: this.currentVariant.id,
            quantity: parseInt(qtyInput?.value || 1)
          }
        ]
      };

      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('カートへの追加に失敗しました');
      }

      // 成功トースト表示
      if (successToast) {
        successToast.hidden = false;
        setTimeout(() => {
          successToast.hidden = true;
        }, 3000);
      }

      // カートドロワーがあれば更新
      if (window.Shopify && window.Shopify.theme && window.Shopify.theme.cart) {
        window.Shopify.theme.cart.refresh();
      }

      // カウント更新（カート数バッジ）
      this.updateCartCount();

    } catch (error) {
      console.error('Add to cart error:', error);
      if (errorMsg) {
        errorMsg.textContent = error.message || 'エラーが発生しました';
        errorMsg.hidden = false;
      }
    } finally {
      // ボタン復元
      btn.disabled = false;
      if (spinner) spinner.hidden = true;
      if (buttonText) buttonText.textContent = 'カートに追加';
    }
  }

  async updateCartCount() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      const countEl = document.querySelector('.cart-count-bubble span');
      if (countEl) {
        countEl.textContent = cart.item_count;
      }
    } catch (error) {
      console.error('Cart count update failed:', error);
    }
  }

  setupFocusTrap() {
    // フォーカス可能な要素を取得
    this.focusableElements = this.modal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (this.focusableElements.length === 0) return;

    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];

    // Tabキーでフォーカストラップ
    this.modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift+Tab
        if (document.activeElement === this.firstFocusable) {
          e.preventDefault();
          this.lastFocusable.focus();
        }
      } else {
        // Tab
        if (document.activeElement === this.lastFocusable) {
          e.preventDefault();
          this.firstFocusable.focus();
        }
      }
    });
  }

  formatMoney(cents) {
    // 簡易フォーマット（Shopify標準: ¥1,000）
    const amount = (cents / 100).toFixed(0);
    return `¥${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  showError(message) {
    const errorMsg = this.modal.querySelector('[data-error-message]');
    if (errorMsg) {
      errorMsg.textContent = message;
      errorMsg.hidden = false;
      setTimeout(() => {
        errorMsg.hidden = true;
      }, 5000);
    }
  }
}

// 初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new QuickView());
} else {
  new QuickView();
}
