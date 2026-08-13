/* EventSphere — Form Validation & Password Toggle Utility */
const EsValidation = {
  // Email validation regex
  emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Display inline field validation error
  showFieldError(field, message) {
    if (!field) return;
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');

    const group = field.closest('.password-toggle-group');
    const targetParent = group || field.parentElement;
    let feedback = targetParent.querySelector('.invalid-feedback');
    
    if (!feedback) {
      feedback = targetParent.nextElementSibling;
      if (!feedback || !feedback.classList.contains('invalid-feedback')) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        targetParent.parentNode.insertBefore(feedback, targetParent.nextSibling);
      }
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  },

  // Clear inline field validation error
  clearFieldError(field) {
    if (!field) return;
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');

    const group = field.closest('.password-toggle-group');
    const targetParent = group || field.parentElement;
    let feedback = targetParent.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = targetParent.nextElementSibling;
    }
    if (feedback && feedback.classList.contains('invalid-feedback')) {
      feedback.textContent = '';
      feedback.style.display = 'none';
    }
  },

  // Clear all field validation errors in a form
  clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.is-invalid').forEach(field => {
      this.clearFieldError(field);
    });
  },

  // Validate a required non-whitespace field.
  // Note: Does NOT modify/trim field.value so user input is untouched.
  validateRequiredField(field, fieldLabel = 'This field') {
    if (!field) return false;
    const value = field.value || '';
    if (value.trim().length === 0) {
      this.showFieldError(field, `${fieldLabel} is required`);
      return false;
    }
    this.clearFieldError(field);
    return true;
  },

  // Validate email field format and required status
  validateEmailField(field) {
    if (!field) return false;
    const value = field.value || '';
    if (value.trim().length === 0) {
      this.showFieldError(field, 'Email is required');
      return false;
    }
    if (!this.emailRegex.test(value.trim())) {
      this.showFieldError(field, 'Please enter a valid email address');
      return false;
    }
    this.clearFieldError(field);
    return true;
  },

  // Validate password field: rejected if empty or whitespace-only.
  // CRITICAL: Does NOT trim field.value — raw value remains unchanged.
  validatePasswordField(field, fieldLabel = 'Password') {
    if (!field) return false;
    const rawValue = field.value || '';
    if (rawValue.length === 0) {
      this.showFieldError(field, `${fieldLabel} is required`);
      return false;
    }
    if (rawValue.trim().length === 0) {
      this.showFieldError(field, `${fieldLabel} cannot be empty or whitespace only`);
      return false;
    }
    this.clearFieldError(field);
    return true;
  },

  // Validate confirm password field: not empty/whitespace-only AND matches password exactly
  validatePasswordConfirmation(passwordField, confirmPasswordField) {
    if (!confirmPasswordField) return false;
    const confirmVal = confirmPasswordField.value || '';
    if (confirmVal.length === 0) {
      this.showFieldError(confirmPasswordField, 'Confirm password is required');
      return false;
    }
    if (confirmVal.trim().length === 0) {
      this.showFieldError(confirmPasswordField, 'Confirm password cannot be whitespace only');
      return false;
    }
    if (confirmPasswordField.value !== passwordField.value) {
      this.showFieldError(confirmPasswordField, 'Passwords do not match');
      return false;
    }
    this.clearFieldError(confirmPasswordField);
    return true;
  },

  // Toggle password visibility for a password field
  togglePasswordVisibility(input, toggleBtn) {
    if (!input || !toggleBtn) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    const label = isPassword ? 'Hide password' : 'Show password';
    toggleBtn.setAttribute('aria-label', label);
    toggleBtn.setAttribute('title', label);

    if (window.EsIcons && (EsIcons.eye || EsIcons.eyeSlash)) {
      toggleBtn.innerHTML = isPassword ? EsIcons.eyeSlash : EsIcons.eye;
    } else {
      toggleBtn.textContent = isPassword ? 'Hide' : 'Show';
    }
  },

  // Initialize password toggle buttons within a container or form
  initPasswordToggles(container = document) {
    const toggleBtns = container.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach(btn => {
      const group = btn.closest('.password-toggle-group');
      if (!group) return;
      const input = group.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      const label = isPassword ? 'Show password' : 'Hide password';
      btn.setAttribute('aria-label', label);
      btn.setAttribute('title', label);

      if (window.EsIcons && (EsIcons.eye || EsIcons.eyeSlash)) {
        btn.innerHTML = isPassword ? EsIcons.eye : EsIcons.eyeSlash;
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePasswordVisibility(input, btn);
      });
    });
  },

  // Attach live validation clearing on user typing
  attachLiveValidation(form) {
    if (!form) return;
    form.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', () => {
        if (input.classList.contains('is-invalid')) {
          this.clearFieldError(input);
        }
      });
    });
  }
};

window.EsValidation = EsValidation;
