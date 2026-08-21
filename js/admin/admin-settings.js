// =========================================================
// EventSphere — Admin Profile & Security Settings Module
// =========================================================

// Toggle Admin Password Visibility
function toggleAdminPassVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = '<i class="bi bi-eye-slash"></i>';
  } else {
    input.type = 'password';
    btn.innerHTML = '<i class="bi bi-eye"></i>';
  }
}

// Load Admin Profile
function loadAdminProfile() {
  const u = EsAuthStore.getUser() || {};
  const nameInput = document.getElementById('adminInputFullName');
  const emailInput = document.getElementById('adminInputEmail');
  const phoneInput = document.getElementById('adminInputPhone');

  if (nameInput) nameInput.value = u.fullName || u.name || '';
  if (emailInput) emailInput.value = u.email || '';
  if (phoneInput) phoneInput.value = u.phoneNumber || u.phone || '';
}

// Handle Admin Profile Update
document.getElementById('adminProfileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveAdminProfileBtn');
  const originalText = btn.innerHTML;

  const fullName = document.getElementById('adminInputFullName').value.trim();
  const email = document.getElementById('adminInputEmail').value.trim();
  const phoneNumber = document.getElementById('adminInputPhone').value.trim();

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-1"></i> Saving...';

    await AuthAPI.updateUserProfile({ fullName, email, phoneNumber });

    // Update local user in auth store
    const u = EsAuthStore.getUser() || {};
    u.fullName = fullName;
    u.email = email;
    u.phoneNumber = phoneNumber;
    EsAuthStore.setUser(u);

    esToast('Administrator profile updated successfully!', 'success');
  } catch (err) {
    esToast(err.message || 'Failed to update profile', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

// Handle Admin Password Change
document.getElementById('adminPasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveAdminPassBtn');
  const originalText = btn.innerHTML;

  const currentPassword = document.getElementById('adminCurrentPassInput').value;
  const newPassword = document.getElementById('adminNewPassInput').value;
  const confirmPassword = document.getElementById('adminConfirmPassInput').value;

  if (newPassword !== confirmPassword) {
    esToast('New password and confirm password do not match.', 'error');
    return;
  }

  if (newPassword.length < 6) {
    esToast('Password must be at least 6 characters.', 'error');
    return;
  }

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-1"></i> Updating...';

    await AuthAPI.changePassword({ currentPassword, newPassword, confirmPassword });
    esToast('Administrator password updated successfully!', 'success');
    e.target.reset();
  } catch (err) {
    esToast(err.message || 'Failed to update password. Please verify current password.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});
