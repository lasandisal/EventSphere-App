// =========================================================
// EventSphere — Organizer Profile & Settings Module
// =========================================================

// Toggle password visibility
function togglePasswordVisibility(inputId, btn) {
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

// Load Organizer & Account Profile
async function loadProfile() {
  const u = EsAuthStore.getUser() || {};
  const emailInput = document.getElementById('profInputEmail');
  if (emailInput) emailInput.value = u.email || '';

  try {
    const raw = await OrganizerAPI.getMyProfile();
    const p = raw?.data || raw || {};
    
    if (document.getElementById('profInputBusiness')) document.getElementById('profInputBusiness').value = p.businessName || '';
    if (document.getElementById('profInputName')) document.getElementById('profInputName').value = p.applicantName || u.fullName || u.name || '';
    if (document.getElementById('profInputPhone')) document.getElementById('profInputPhone').value = p.applicantPhone || u.phoneNumber || u.phone || '';
    if (document.getElementById('profInputNic')) document.getElementById('profInputNic').value = p.nicOrPassportNumber || p.nicNumber || p.regNumber || '';
    if (document.getElementById('profInputRegNo')) document.getElementById('profInputRegNo').value = p.businessRegistrationNumber || '';
    if (document.getElementById('profInputBio')) document.getElementById('profInputBio').value = p.bio || p.description || '';

    const statusBadgeEl = document.getElementById('profStatusBadge');
    if (statusBadgeEl) {
      const status = (p.status || 'APPROVED').toUpperCase();
      if (status === 'APPROVED' || status === 'VERIFIED') {
        statusBadgeEl.className = 'status-badge status-confirmed';
        statusBadgeEl.innerHTML = '<i class="bi bi-shield-check me-1"></i> Verified Organizer';
      } else {
        statusBadgeEl.className = 'status-badge status-pending';
        statusBadgeEl.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> ' + status;
      }
    }
  } catch (e) {
    console.error('Could not load organizer profile:', e);
    if (document.getElementById('profInputName')) document.getElementById('profInputName').value = u.fullName || u.name || '';
    if (document.getElementById('profInputPhone')) document.getElementById('profInputPhone').value = u.phoneNumber || u.phone || '';
  }
}

// Handle Organizer Profile Update
document.getElementById('orgProfileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('saveProfileBtn');
  const originalText = btn.innerHTML;

  const payload = Object.fromEntries(new FormData(e.target).entries());

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-arrow-repeat spin me-1"></i> Saving...';

    await OrganizerAPI.updateProfile(payload);

    // Update local store
    const u = EsAuthStore.getUser() || {};
    if (payload.applicantName) u.fullName = payload.applicantName;
    if (payload.applicantPhone) u.phoneNumber = payload.applicantPhone;
    EsAuthStore.setUser(u);

    esToast('Organizer profile updated successfully!', 'success');
  } catch (err) {
    esToast(err.message || 'Failed to update profile', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});

// Handle Change Password
document.getElementById('changePasswordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('savePasswordBtn');
  const originalText = btn.innerHTML;

  const currentPassword = document.getElementById('currentPasswordInput').value;
  const newPassword = document.getElementById('newPasswordInput').value;
  const confirmPassword = document.getElementById('confirmPasswordInput').value;

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
    esToast('Password updated successfully!', 'success');
    e.target.reset();
  } catch (err) {
    esToast(err.message || 'Failed to update password. Please check your current password.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
});
