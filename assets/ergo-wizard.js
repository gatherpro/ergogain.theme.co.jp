/**
 * Full Order Wizard - フルオーダーメイド購入ウィザード
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

      this.init();
    }

    init() {
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

    updateSummary() {
      if (!this.summaryContainer) return;

      this.collectSelectedOptions();

      // Clear existing items except hand photo
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
          label.textContent = optionLabels[key] + ':';

          const valueSpan = document.createElement('span');
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
      // Step 1: Hand photo required
      if (this.currentStep === 1) {
        if (!this.uploadedPhoto) {
          this.showError('手の写真をアップロードしてください');
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
    }

    updateNavigationButtons() {
      // Previous button
      if (this.prevBtn) {
        this.prevBtn.disabled = this.currentStep === 1;
      }

      // Next button
      if (this.nextBtn) {
        const isLastStep = this.currentStep === this.totalSteps;
        this.nextBtn.style.display = isLastStep ? 'none' : '';
        this.updateNextButton();
      }

      // Add to cart button
      if (this.addToCartBtn) {
        const isLastStep = this.currentStep === this.totalSteps;
        this.addToCartBtn.style.display = isLastStep ? '' : 'none';
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

    async addToCart() {
      this.collectSelectedOptions();

      // Validate
      if (!this.uploadedPhoto) {
        this.showToast('手の写真がアップロードされていません', 'error');
        return;
      }

      // Get variant ID
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

        // Success
        this.showToast('カートに追加しました', 'success');

        // Trigger cart drawer
        setTimeout(() => {
          document.dispatchEvent(new CustomEvent('cart:refresh'));
          this.close();
        }, 1000);

      } catch (error) {
        console.error('Add to cart error:', error);
        this.showToast('エラーが発生しました', 'error');
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
    const wizards = document.querySelectorAll('[data-section-id]');
    wizards.forEach(wizard => {
      if (wizard.classList.contains('eg-wizard-')) {
        return; // Already initialized
      }

      const instance = new FullOrderWizard(wizard);
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
      const wizard = event.target.querySelector('[data-section-id]');
      if (wizard) {
        new FullOrderWizard(wizard);
      }
    });
  }

  // Global function to open wizard
  window.openFullOrderWizard = function(sectionId) {
    const wizard = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (wizard && wizard.wizardInstance) {
      wizard.wizardInstance.open();
    } else if (wizard) {
      const instance = new FullOrderWizard(wizard);
      instance.open();
    }
  };

})();
