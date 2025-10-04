/**
 * Full Order Wizard - フルオーダーメイド購入ウィザード
 *
 * 機能:
 * - 6ステップのフロー管理
 * - 手の写真アップロード（10MB上限、画像拡張子判定）
 * - リアルタイム価格計算
 * - プレビュー画像自動更新（フォールバック解決）
 * - バリデーション
 * - カートへ追加
 * - アクセシビリティ対応
 *
 * 依存: なし
 */

(function() {
  'use strict';

  class FullOrderWizard {
    constructor(element) {
      this.wizard = element;
      this.sectionId = this.wizard.dataset.sectionId;
      this.basePrice = parseFloat(this.wizard.dataset.basePrice) || 0;
      this.currency = this.wizard.dataset.currency || '¥';

      // Elements
      this.rail = this.wizard.querySelector('[data-rail]');
      this.steps = Array.from(this.wizard.querySelectorAll('[data-step]'));
      this.stepCurrent = this.wizard.querySelector('[data-step-current]');
      this.stepTotal = this.wizard.querySelector('[data-step-total]');
      this.prevBtn = this.wizard.querySelector('[data-prev]');
      this.nextBtn = this.wizard.querySelector('[data-next]');
      this.addToCartBtn = this.wizard.querySelector('[data-add-to-cart]');
      this.closeBtn = this.wizard.querySelector('[data-wizard-close]');
      this.priceDisplay = this.wizard.querySelector('[data-price-display]');
      this.totalPriceDisplay = this.wizard.querySelector('[data-total-price]');
      this.toast = this.wizard.querySelector('[data-toast]');
      this.previewImage = this.wizard.querySelector('[data-preview-image]');
      this.summaryContainer = this.wizard.querySelector('[data-summary]');

      // Photo upload elements
      this.photoInput = this.wizard.querySelector('[data-hand-photo-input]');
      this.photoPreview = this.wizard.querySelector('[data-photo-preview]');
      this.photoPreviewImg = this.wizard.querySelector('[data-photo-preview-img]');
      this.photoReplaceBtn = this.wizard.querySelector('[data-photo-replace]');
      this.photoDeleteBtn = this.wizard.querySelector('[data-photo-delete]');
      this.uploadError = this.wizard.querySelector('[data-upload-error]');

      // State
      this.currentStep = 1;
      this.totalSteps = this.steps.length;
      this.uploadedPhoto = null;
      this.selectedOptions = {};
      this.previewMap = this.loadPreviewMap();

      this.init();
    }

    init() {
      // Set total steps
      if (this.stepTotal) {
        this.stepTotal.textContent = this.totalSteps;
      }

      // Event listeners
      if (this.prevBtn) {
        this.prevBtn.addEventListener('click', () => this.goToPrevStep());
      }

      if (this.nextBtn) {
        this.nextBtn.addEventListener('click', () => this.goToNextStep());
      }

      if (this.addToCartBtn) {
        this.addToCartBtn.addEventListener('click', () => this.addToCart());
      }

      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.close());
      }

      // Photo upload
      if (this.photoInput) {
        this.photoInput.addEventListener('change', (e) => this.handlePhotoUpload(e));

        // Drag and drop
        const uploadLabel = this.photoInput.nextElementSibling;
        if (uploadLabel) {
          uploadLabel.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadLabel.style.borderColor = 'rgba(0, 0, 0, 0.6)';
          });

          uploadLabel.addEventListener('dragleave', () => {
            uploadLabel.style.borderColor = '';
          });

          uploadLabel.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadLabel.style.borderColor = '';

            if (e.dataTransfer.files.length > 0) {
              this.photoInput.files = e.dataTransfer.files;
              this.handlePhotoUpload({ target: this.photoInput });
            }
          });
        }
      }

      if (this.photoReplaceBtn) {
        this.photoReplaceBtn.addEventListener('click', () => {
          this.photoInput.click();
        });
      }

      if (this.photoDeleteBtn) {
        this.photoDeleteBtn.addEventListener('click', () => {
          this.deletePhoto();
        });
      }

      // Option changes
      const optionInputs = this.wizard.querySelectorAll('[data-option-key]');
      optionInputs.forEach(input => {
        input.addEventListener('change', () => this.handleOptionChange());
      });

      // Initialize
      this.updateStepDisplay();
      this.updatePrice();
      this.updatePreview();
    }

    loadPreviewMap() {
      const mapElement = this.wizard.querySelector('[data-preview-map]');
      if (!mapElement) return {};

      try {
        return JSON.parse(mapElement.textContent);
      } catch (e) {
        console.error('Failed to parse preview map:', e);
        return {};
      }
    }

    handlePhotoUpload(event) {
      const file = event.target.files[0];

      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (!validTypes.includes(file.type)) {
        this.showError('対応している画像形式: JPG, PNG, WebP, HEIC');
        this.photoInput.value = '';
        return;
      }

      // Validate file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.showError('ファイルサイズは10MB以下にしてください');
        this.photoInput.value = '';
        return;
      }

      // Read and preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.uploadedPhoto = e.target.result;

        if (this.photoPreviewImg) {
          this.photoPreviewImg.src = e.target.result;
        }

        if (this.photoPreview) {
          this.photoPreview.style.display = 'block';
        }

        // Hide upload area
        const uploadArea = this.wizard.querySelector('.eg-wizard__upload');
        if (uploadArea) {
          uploadArea.style.display = 'none';
        }

        this.hideError();
        this.updateNextButton();
      };

      reader.readAsDataURL(file);
    }

    deletePhoto() {
      this.uploadedPhoto = null;

      if (this.photoInput) {
        this.photoInput.value = '';
      }

      if (this.photoPreview) {
        this.photoPreview.style.display = 'none';
      }

      // Show upload area
      const uploadArea = this.wizard.querySelector('.eg-wizard__upload');
      if (uploadArea) {
        uploadArea.style.display = 'block';
      }

      this.updateNextButton();
    }

    showError(message) {
      if (this.uploadError) {
        this.uploadError.textContent = message;
        this.uploadError.style.display = 'block';
      }
    }

    hideError() {
      if (this.uploadError) {
        this.uploadError.style.display = 'none';
      }
    }

    handleOptionChange() {
      this.collectSelectedOptions();
      this.updatePrice();
      this.updatePreview();
      this.updateSummary();
    }

    collectSelectedOptions() {
      this.selectedOptions = {};

      const optionInputs = this.wizard.querySelectorAll('[data-option-key]:checked, [data-option-key][type="text"]');
      optionInputs.forEach(input => {
        const key = input.dataset.optionKey;
        this.selectedOptions[key] = input.value;
      });
    }

    updatePrice() {
      let totalPrice = this.basePrice;

      const checkedOptions = this.wizard.querySelectorAll('[data-option-key]:checked');
      checkedOptions.forEach(input => {
        const delta = parseFloat(input.dataset.priceDelta) || 0;
        totalPrice += delta;
      });

      const formattedPrice = this.formatPrice(totalPrice);

      if (this.priceDisplay) {
        this.priceDisplay.textContent = formattedPrice;
      }

      if (this.totalPriceDisplay) {
        this.totalPriceDisplay.textContent = formattedPrice;
      }
    }

    formatPrice(price) {
      return this.currency + price.toLocaleString('ja-JP');
    }

    updatePreview() {
      if (!this.previewImage || Object.keys(this.previewMap).length === 0) return;

      this.collectSelectedOptions();

      // Build query string from selected options
      const queryParts = [];
      for (const [key, value] of Object.entries(this.selectedOptions)) {
        if (value && key !== 'engrave_text' && key !== 'hand_photo') {
          queryParts.push(`${key}=${value}`);
        }
      }
      const queryString = queryParts.sort().join('&');

      // Find best match in preview map
      let bestMatch = null;
      let bestMatchScore = 0;

      for (const [mapKey, imageUrl] of Object.entries(this.previewMap)) {
        const score = this.calculateMatchScore(queryString, mapKey);
        if (score > bestMatchScore) {
          bestMatchScore = score;
          bestMatch = imageUrl;
        }
      }

      if (bestMatch) {
        this.previewImage.src = bestMatch;
      }
    }

    calculateMatchScore(query, mapKey) {
      const queryParts = query.split('&');
      const mapParts = mapKey.split('&');

      let matches = 0;
      queryParts.forEach(part => {
        if (mapParts.includes(part)) {
          matches++;
        }
      });

      return matches;
    }

    updateSummary() {
      if (!this.summaryContainer) return;

      this.collectSelectedOptions();

      // Clear existing summary items (except hand photo)
      const existingItems = this.summaryContainer.querySelectorAll('.eg-wizard__summary-item:not([data-summary-hand])');
      existingItems.forEach(item => item.remove());

      // Add option summaries
      const optionLabels = {
        'keycap_type': 'キーキャップタイプ',
        'keycap_color': 'キーキャップカラー',
        'switch_model': 'スイッチ',
        'case_color': '本体カラー',
        'plate_material': 'プレート素材',
        'layout': '配列',
        'size': 'サイズ',
        'engrave_text': '刻印テキスト'
      };

      for (const [key, value] of Object.entries(this.selectedOptions)) {
        if (value && key !== 'hand_photo') {
          const item = document.createElement('div');
          item.className = 'eg-wizard__summary-item';

          const label = document.createElement('span');
          label.className = 'eg-wizard__summary-label';
          label.textContent = optionLabels[key] + ':';

          const valueSpan = document.createElement('span');
          valueSpan.className = 'eg-wizard__summary-value';
          valueSpan.textContent = value;

          item.appendChild(label);
          item.appendChild(valueSpan);
          this.summaryContainer.appendChild(item);
        }
      }
    }

    goToPrevStep() {
      if (this.currentStep > 1) {
        this.currentStep--;
        this.updateStepDisplay();
      }
    }

    goToNextStep() {
      if (!this.validateCurrentStep()) return;

      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
        this.updateStepDisplay();
      }
    }

    validateCurrentStep() {
      const currentStepElement = this.steps[this.currentStep - 1];

      // Step 1: Hand photo required
      if (this.currentStep === 1) {
        if (!this.uploadedPhoto) {
          this.showError('手の写真をアップロードしてください');
          return false;
        }
      }

      // Check required inputs in current step
      const requiredInputs = currentStepElement.querySelectorAll('[required]');
      for (const input of requiredInputs) {
        if (input.type === 'radio') {
          const radioGroup = currentStepElement.querySelectorAll(`[name="${input.name}"]`);
          const hasChecked = Array.from(radioGroup).some(r => r.checked);
          if (!hasChecked) {
            this.showError('必須項目を選択してください');
            return false;
          }
        } else if (!input.value.trim()) {
          this.showError('必須項目を入力してください');
          return false;
        }
      }

      return true;
    }

    updateStepDisplay() {
      // Update progress counter
      if (this.stepCurrent) {
        this.stepCurrent.textContent = this.currentStep;
      }

      // Slide rail
      const translateX = -(this.currentStep - 1) * 100;
      if (this.rail) {
        this.rail.style.transform = `translateX(${translateX}%)`;
      }

      // Update navigation buttons
      this.updateNavigationButtons();

      // Update summary on last step
      if (this.currentStep === this.totalSteps) {
        this.updateSummary();
      }

      // Announce to screen readers
      this.announceStep();
    }

    updateNavigationButtons() {
      // Previous button
      if (this.prevBtn) {
        this.prevBtn.disabled = this.currentStep === 1;
      }

      // Next button
      if (this.nextBtn) {
        const isLastStep = this.currentStep === this.totalSteps;
        this.nextBtn.style.display = isLastStep ? 'none' : 'flex';
        this.updateNextButton();
      }

      // Add to cart button
      if (this.addToCartBtn) {
        const isLastStep = this.currentStep === this.totalSteps;
        this.addToCartBtn.style.display = isLastStep ? 'flex' : 'none';
      }
    }

    updateNextButton() {
      if (!this.nextBtn) return;

      // Disable next button on step 1 if no photo uploaded
      if (this.currentStep === 1) {
        this.nextBtn.disabled = !this.uploadedPhoto;
      } else {
        this.nextBtn.disabled = false;
      }
    }

    announceStep() {
      const currentStepElement = this.steps[this.currentStep - 1];
      const heading = currentStepElement.querySelector('.eg-step__heading');

      if (heading && this.wizard.setAttribute) {
        this.wizard.setAttribute('aria-label', `ステップ ${this.currentStep} / ${this.totalSteps}: ${heading.textContent}`);
      }
    }

    async addToCart() {
      this.collectSelectedOptions();

      // Validate
      if (!this.uploadedPhoto) {
        this.showToast('手の写真がアップロードされていません', 'error');
        return;
      }

      // Get variant ID if exists
      const variantIdInput = this.wizard.querySelector('[data-variant-id]');
      const variantId = variantIdInput ? variantIdInput.value : null;

      if (!variantId) {
        this.showToast('商品が設定されていません', 'error');
        return;
      }

      // Build form data
      const formData = {
        id: variantId,
        quantity: 1,
        properties: {
          ...this.selectedOptions,
          'hand_photo': this.uploadedPhoto
        }
      };

      // Show loading
      this.wizard.classList.add('is-loading');

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('カートへの追加に失敗しました');
        }

        const data = await response.json();

        // Success
        this.showToast('カートに追加しました', 'success');

        // Trigger cart drawer if available
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('cart:refresh'));
          this.close();
        }, 1000);

      } catch (error) {
        console.error('Add to cart error:', error);
        this.showToast('エラーが発生しました。もう一度お試しください。', 'error');
      } finally {
        this.wizard.classList.remove('is-loading');
      }
    }

    showToast(message, type = 'info') {
      if (!this.toast) return;

      this.toast.textContent = message;
      this.toast.style.display = 'block';

      if (type === 'error') {
        this.toast.style.backgroundColor = '#dc3545';
      } else if (type === 'success') {
        this.toast.style.backgroundColor = '#28a745';
      }

      setTimeout(() => {
        this.toast.style.display = 'none';
      }, 3000);
    }

    open() {
      this.wizard.classList.add('is-active');
      document.body.style.overflow = 'hidden';

      // Focus first interactive element
      setTimeout(() => {
        const firstInput = this.steps[0].querySelector('input, button');
        if (firstInput) firstInput.focus();
      }, 400);
    }

    close() {
      this.wizard.classList.remove('is-active');
      document.body.style.overflow = '';
    }
  }

  // Initialize wizards
  function initWizards() {
    const wizards = document.querySelectorAll('.eg-wizard');
    wizards.forEach(wizard => {
      const instance = new FullOrderWizard(wizard);

      // Store instance for external access
      wizard.wizardInstance = instance;
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWizards);
  } else {
    initWizards();
  }

  // Re-initialize on Shopify theme editor events
  if (window.Shopify && window.Shopify.designMode) {
    document.addEventListener('shopify:section:load', (event) => {
      const wizard = event.target.querySelector('.eg-wizard');
      if (wizard) {
        new FullOrderWizard(wizard);
      }
    });
  }

  // Global function to open wizard
  window.openFullOrderWizard = function(sectionId) {
    const wizard = document.querySelector(`.eg-wizard[data-section-id="${sectionId}"]`);
    if (wizard && wizard.wizardInstance) {
      wizard.wizardInstance.open();
    } else if (wizard) {
      const instance = new FullOrderWizard(wizard);
      instance.open();
    }
  };

})();
