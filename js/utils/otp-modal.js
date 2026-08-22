/* =========================================================
   EventSphere — Email OTP Verification Modal Component
   Provides interactive 6-digit PIN inputs, paste support,
   60s countdown timer, resend OTP, and instant JWT auth.
   ========================================================= */

(function(global) {
  let modalInstance = null;
  let timerInterval = null;
  let currentConfig = null;

  const OTP_COUNTDOWN_SECONDS = 60;

  function createModalDOM() {
    let existing = document.getElementById('esOtpModalBackdrop');
    if (existing) return existing;

    const backdrop = document.createElement('div');
    backdrop.id = 'esOtpModalBackdrop';
    backdrop.className = 'es-otp-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'otpModalTitle');

    backdrop.innerHTML = `
      <div class="es-otp-modal-container">
        <div class="es-otp-card">
          <!-- Close button -->
          <button type="button" class="es-otp-close" id="esOtpCloseBtn" aria-label="Close modal">&times;</button>
          
          <!-- Top glowing visual icon -->
          <div class="otp-badge-icon mb-3">
            <i class="bi bi-shield-lock-fill"></i>
          </div>

          <!-- Header Titles -->
          <h3 class="otp-modal-title text-white mb-2" id="otpModalTitle">Verify Your Email</h3>
          <p class="otp-modal-subtitle text-muted-soft mb-4">
            We've sent a 6-digit verification code to<br>
            <span class="otp-target-email text-white fw-bold" id="otpTargetEmail"></span>
          </p>

          <!-- Error Alert Banner -->
          <div class="otp-error-badge mb-3" id="otpErrorBadge" style="display: none;">
            <i class="bi bi-exclamation-triangle-fill flex-shrink-0"></i>
            <span class="otp-error-text" id="otpErrorText">Invalid verification code.</span>
          </div>

          <!-- Success Alert Banner (for resend/success feedback) -->
          <div class="otp-success-badge mb-3" id="otpSuccessBadge" style="display: none;">
            <i class="bi bi-check-circle-fill flex-shrink-0"></i>
            <span class="otp-success-text" id="otpSuccessText">New code sent to your email!</span>
          </div>

          <!-- 6-digit PIN input fields -->
          <div class="otp-boxes-wrapper mb-4" id="otpBoxesWrapper">
            <div class="otp-boxes d-flex justify-content-center gap-2">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" data-index="0" autocomplete="one-time-code" aria-label="Digit 1">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" data-index="1" autocomplete="one-time-code" aria-label="Digit 2">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" data-index="2" autocomplete="one-time-code" aria-label="Digit 3">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" data-index="3" autocomplete="one-time-code" aria-label="Digit 4">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" data-index="4" autocomplete="one-time-code" aria-label="Digit 5">
              <input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="1" class="otp-box" data-index="5" autocomplete="one-time-code" aria-label="Digit 6">
            </div>
          </div>

          <!-- Action Button: Verify -->
          <button type="button" class="btn btn-primary btn-lg w-100 mb-3" id="otpVerifyBtn" disabled>
            <span class="btn-text">Verify Email</span>
            <span class="spinner-border spinner-border-sm ms-2 d-none" role="status" aria-hidden="true"></span>
          </button>

          <!-- Resend Row with Countdown -->
          <div class="otp-resend-row text-center mt-2">
            <div id="otpTimerWrap" class="otp-timer-text text-muted-soft">
              <i class="bi bi-clock-history me-1"></i> Resend code in <strong class="text-white" id="otpTimerSec">60s</strong>
            </div>
            <button type="button" class="btn btn-link btn-resend-otp p-0 d-none" id="otpResendBtn">
              Didn't receive code? <span style="color: var(--neon-rose); font-weight: 600; text-decoration: underline;">Resend Code</span>
            </button>
          </div>

          <!-- Secondary link: Edit email / Cancel -->
          <div class="text-center mt-3 pt-2" style="border-top: 1px solid rgba(255,255,255,0.06);">
            <button type="button" class="btn btn-link btn-sm text-muted-soft p-0 text-decoration-none" id="otpChangeEmailBtn" style="font-size: 0.84rem;">
              <i class="bi bi-arrow-left me-1"></i> Wrong email address? Edit
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    return backdrop;
  }

  function getDigits() {
    const inputs = document.querySelectorAll('#esOtpModalBackdrop .otp-box');
    let otp = '';
    inputs.forEach(inp => otp += (inp.value || '').trim());
    return otp;
  }

  function updateVerifyButtonState() {
    const verifyBtn = document.getElementById('otpVerifyBtn');
    if (!verifyBtn) return;
    const otp = getDigits();
    const isComplete = otp.length === 6 && /^\d{6}$/.test(otp);
    if (!verifyBtn.classList.contains('is-loading')) {
      verifyBtn.disabled = !isComplete;
    }
  }

  function setVerifyLoading(isLoading) {
    const btn = document.getElementById('otpVerifyBtn');
    if (!btn) return;
    const textSpan = btn.querySelector('.btn-text');
    const spinner = btn.querySelector('.spinner-border');

    if (isLoading) {
      btn.classList.add('is-loading');
      btn.disabled = true;
      if (textSpan) textSpan.textContent = 'Verifying...';
      if (spinner) spinner.classList.remove('d-none');
    } else {
      btn.classList.remove('is-loading');
      if (textSpan) textSpan.textContent = 'Verify Email';
      if (spinner) spinner.classList.add('d-none');
      updateVerifyButtonState();
    }
  }

  function showError(msg) {
    const badge = document.getElementById('otpErrorBadge');
    const text = document.getElementById('otpErrorText');
    const successBadge = document.getElementById('otpSuccessBadge');
    const card = document.querySelector('#esOtpModalBackdrop .es-otp-card');

    if (successBadge) successBadge.style.display = 'none';

    if (text) text.textContent = msg || 'Invalid or expired code.';
    if (badge) badge.style.display = 'flex';

    if (card) {
      card.classList.remove('otp-shake');
      void card.offsetWidth; // Force reflow
      card.classList.add('otp-shake');
    }

    const inputs = document.querySelectorAll('#esOtpModalBackdrop .otp-box');
    inputs.forEach(inp => inp.classList.add('is-invalid'));
  }

  function clearError() {
    const badge = document.getElementById('otpErrorBadge');
    if (badge) badge.style.display = 'none';

    const inputs = document.querySelectorAll('#esOtpModalBackdrop .otp-box');
    inputs.forEach(inp => inp.classList.remove('is-invalid'));
  }

  function showSuccessBanner(msg) {
    const badge = document.getElementById('otpSuccessBadge');
    const text = document.getElementById('otpSuccessText');
    const errorBadge = document.getElementById('otpErrorBadge');

    if (errorBadge) errorBadge.style.display = 'none';
    if (text) text.textContent = msg || 'Code sent successfully!';
    if (badge) {
      badge.style.display = 'flex';
      setTimeout(() => {
        if (badge) badge.style.display = 'none';
      }, 5000);
    }
  }

  function clearInputs() {
    const inputs = document.querySelectorAll('#esOtpModalBackdrop .otp-box');
    inputs.forEach(inp => {
      inp.value = '';
      inp.classList.remove('is-invalid');
      inp.classList.remove('is-filled');
    });
    updateVerifyButtonState();
    if (inputs[0]) inputs[0].focus();
  }

  function startCountdown(seconds = OTP_COUNTDOWN_SECONDS) {
    if (timerInterval) clearInterval(timerInterval);

    const timerWrap = document.getElementById('otpTimerWrap');
    const timerSec = document.getElementById('otpTimerSec');
    const resendBtn = document.getElementById('otpResendBtn');

    if (timerWrap) timerWrap.classList.remove('d-none');
    if (resendBtn) resendBtn.classList.add('d-none');

    let remaining = seconds;
    if (timerSec) timerSec.textContent = `${remaining}s`;

    timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        if (timerSec) timerSec.textContent = `${remaining}s`;
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        if (timerWrap) timerWrap.classList.add('d-none');
        if (resendBtn) {
          resendBtn.classList.remove('d-none');
          resendBtn.disabled = false;
        }
      }
    }, 1000);
  }

  function attachEventHandlers() {
    const backdrop = document.getElementById('esOtpModalBackdrop');
    if (!backdrop || backdrop.dataset.bound === 'true') return;
    backdrop.dataset.bound = 'true';

    const inputs = Array.from(backdrop.querySelectorAll('.otp-box'));
    const verifyBtn = document.getElementById('otpVerifyBtn');
    const resendBtn = document.getElementById('otpResendBtn');
    const closeBtn = document.getElementById('esOtpCloseBtn');
    const changeEmailBtn = document.getElementById('otpChangeEmailBtn');

    // Input interaction & auto-advance
    inputs.forEach((input, index) => {
      // Typing handler
      input.addEventListener('input', (e) => {
        clearError();
        const val = input.value.replace(/[^0-9]/g, '');
        input.value = val ? val.slice(-1) : '';

        if (input.value) {
          input.classList.add('is-filled');
          if (index < inputs.length - 1) {
            inputs[index + 1].focus();
            inputs[index + 1].select();
          }
        } else {
          input.classList.remove('is-filled');
        }

        updateVerifyButtonState();

        // Auto verify when 6 digits are typed
        if (getDigits().length === 6) {
          submitOtp();
        }
      });

      // Keydown handling for Backspace, Arrows
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          if (!input.value && index > 0) {
            inputs[index - 1].focus();
            inputs[index - 1].value = '';
            inputs[index - 1].classList.remove('is-filled');
            updateVerifyButtonState();
            e.preventDefault();
          }
        } else if (e.key === 'ArrowLeft' && index > 0) {
          inputs[index - 1].focus();
          e.preventDefault();
        } else if (e.key === 'ArrowRight' && index < inputs.length - 1) {
          inputs[index + 1].focus();
          e.preventDefault();
        } else if (e.key === 'Enter') {
          if (getDigits().length === 6) {
            submitOtp();
          }
        }
      });

      // Paste handling: splits full code across boxes
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        clearError();
        const pastedData = (e.clipboardData || window.clipboardData).getData('text');
        if (!pastedData) return;

        const cleanDigits = pastedData.replace(/\D/g, '').slice(0, 6);
        if (!cleanDigits) return;

        cleanDigits.split('').forEach((char, i) => {
          if (inputs[i]) {
            inputs[i].value = char;
            inputs[i].classList.add('is-filled');
          }
        });

        const nextIndex = Math.min(cleanDigits.length, inputs.length - 1);
        if (inputs[nextIndex]) {
          inputs[nextIndex].focus();
        }

        updateVerifyButtonState();

        if (cleanDigits.length === 6) {
          submitOtp();
        }
      });

      input.addEventListener('focus', () => {
        input.select();
      });
    });

    // Verify button click
    verifyBtn.addEventListener('click', () => {
      submitOtp();
    });

    // Resend button click
    resendBtn.addEventListener('click', async () => {
      if (!currentConfig || !currentConfig.email) return;
      resendBtn.disabled = true;
      resendBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Sending code...`;

      try {
        await AuthAPI.resendOtp({ email: currentConfig.email });
        if (typeof esToast === 'function') {
          esToast('A new verification code has been sent to your email.');
        }
        showSuccessBanner('A fresh 6-digit code has been sent!');
        clearInputs();
        startCountdown(OTP_COUNTDOWN_SECONDS);
      } catch (err) {
        showError(err.message || 'Failed to resend code. Please try again.');
        resendBtn.disabled = false;
        resendBtn.innerHTML = `Didn't receive code? <span style="color: var(--neon-rose); font-weight: 600; text-decoration: underline;">Resend Code</span>`;
      }
    });

    // Close actions
    closeBtn?.addEventListener('click', () => EsOtpModal.close());
    changeEmailBtn?.addEventListener('click', () => {
      EsOtpModal.close();
      if (currentConfig && typeof currentConfig.onEditEmail === 'function') {
        currentConfig.onEditEmail();
      }
    });

    // Close on clicking outer backdrop
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        EsOtpModal.close();
      }
    });

    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('is-open')) {
        EsOtpModal.close();
      }
    });
  }

  async function submitOtp() {
    const otp = getDigits();
    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      showError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!currentConfig || !currentConfig.email) {
      showError('Email address is missing. Please refresh and try again.');
      return;
    }

    setVerifyLoading(true);
    clearError();

    try {
      const data = await AuthAPI.verifyOtp({ email: currentConfig.email, otp });
      setVerifyLoading(false);

      if (typeof esToast === 'function') {
        esToast('Email verified successfully! Welcome to EventSphere.');
      }

      EsOtpModal.close();

      if (currentConfig && typeof currentConfig.onSuccess === 'function') {
        currentConfig.onSuccess(data);
      } else {
        // Default redirect resolution
        const params = new URLSearchParams(window.location.search);
        const redirectUrl = params.get('redirect');
        setTimeout(() => {
          if (redirectUrl) {
            window.location.href = decodeURIComponent(redirectUrl);
          } else {
            const isSub = typeof window !== 'undefined' && window.location.pathname.includes('/pages/');
            const rootPrefix = isSub ? '../' : './';
            const pagesPrefix = isSub ? '' : 'pages/';

            if (EsAuthStore.hasRole('ADMIN')) {
              window.location.href = `${pagesPrefix}admin-dashboard.html`;
            } else if (EsAuthStore.hasRole('ORGANIZER')) {
              window.location.href = `${pagesPrefix}organizer-dashboard.html`;
            } else {
              window.location.href = `${rootPrefix}index.html`;
            }
          }
        }, 500);
      }
    } catch (err) {
      setVerifyLoading(false);
      const msg = err.message || 'Invalid or expired verification code.';
      showError(msg);
    }
  }

  const EsOtpModal = {
    /**
     * Open the OTP Verification Modal
     * @param {Object} options
     * @param {string} options.email - User email to verify
     * @param {string} [options.title] - Custom modal title
     * @param {string} [options.message] - Custom description message
     * @param {number} [options.countdown] - Countdown in seconds (default 60)
     * @param {Function} [options.onSuccess] - Callback when verification succeeds
     * @param {Function} [options.onEditEmail] - Callback if user clicks "Wrong email? Edit"
     */
    open(options = {}) {
      currentConfig = options;
      const backdrop = createModalDOM();
      attachEventHandlers();

      const emailEl = document.getElementById('otpTargetEmail');
      if (emailEl) emailEl.textContent = options.email || '';

      const titleEl = document.getElementById('otpModalTitle');
      if (titleEl && options.title) titleEl.textContent = options.title;

      clearError();
      const successBadge = document.getElementById('otpSuccessBadge');
      if (successBadge) successBadge.style.display = 'none';

      clearInputs();
      startCountdown(options.countdown || OTP_COUNTDOWN_SECONDS);

      backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      // Focus first input box
      setTimeout(() => {
        const firstInp = backdrop.querySelector('.otp-box[data-index="0"]');
        if (firstInp) firstInp.focus();
      }, 100);
    },

    /**
     * Close the modal and clean up
     */
    close() {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
      const backdrop = document.getElementById('esOtpModalBackdrop');
      if (backdrop) {
        backdrop.classList.remove('is-open');
      }
      document.body.style.overflow = '';
    }
  };

  global.EsOtpModal = EsOtpModal;
})(typeof window !== 'undefined' ? window : this);
