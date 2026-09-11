// =========================================================
// EventSphere — Enterprise Event Cancellation & Refund Suite
// Provides danger-zone verification, cascade invalidation,
// and itemized PayHere refund audit manifests.
// =========================================================

(function (global) {
  'use strict';

  let cancelModalInstance = null;
  let refundModalInstance = null;

  // Ensure danger-zone cancellation modal exists in DOM
  function getOrCreateCancelModal() {
    let el = document.getElementById('esCancellationSafetyModal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'esCancellationSafetyModal';
      el.className = 'modal fade';
      el.tabIndex = -1;
      el.setAttribute('aria-hidden', 'true');
      el.setAttribute('data-bs-backdrop', 'static');
      document.body.appendChild(el);
    }
    return el;
  }

  // Ensure refund manifest modal exists in DOM
  function getOrCreateRefundModal() {
    let el = document.getElementById('esRefundManifestModal');
    if (!el) {
      el = document.createElement('div');
      el.id = 'esRefundManifestModal';
      el.className = 'modal fade';
      el.tabIndex = -1;
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
    }
    return el;
  }

  /**
   * Opens the danger-zone event cancellation modal.
   * Prompts for mandatory reason, shows affected attendee count and refund stake,
   * and requires typing "CANCEL" to confirm.
   */
  async function openEventCancellationModal(event, onCancelled) {
    if (!event || !event.id) {
      console.error('Invalid event passed to openEventCancellationModal:', event);
      return;
    }

    const modalEl = getOrCreateCancelModal();

    // Initial render with loading state for attendees/revenue
    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content text-white" style="background:#13151f; border:1px solid rgba(239,68,68,0.4); border-radius:18px; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
          <div class="modal-header border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-3">
              <div style="width:48px; height:48px; border-radius:12px; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); display:flex; align-items:center; justify-content:center;">
                <i class="bi bi-shield-exclamation text-danger fs-3"></i>
              </div>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0">Danger Zone: Cancel Event</h5>
                <span class="text-danger small fw-semibold">Permanent irreversible action</span>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body px-4 py-3">
            <div class="p-3 mb-3 rounded-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
              <h6 class="fw-bold text-white mb-1" id="esCancelEventTitle">${escapeHtml(event.title || 'Event')}</h6>
              <div class="small text-muted-soft d-flex flex-wrap gap-3">
                <span><i class="bi bi-calendar3 me-1 text-primary"></i> ${event.startDatetime ? new Date(event.startDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBA'}</span>
                <span><i class="bi bi-geo-alt me-1 text-primary"></i> ${escapeHtml(event.venueName || 'Venue TBA')}</span>
              </div>
            </div>

            <!-- Impact Metrics Overview -->
            <div class="row g-2 mb-3" id="esCancelImpactRow">
              <div class="col-sm-4">
                <div class="p-3 rounded-3 text-center" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);">
                  <div class="small text-muted-soft">Registered Bookings</div>
                  <div class="h5 fw-bold text-white mb-0" id="esCancelBookingCount"><i class="bi bi-arrow-repeat spin"></i></div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="p-3 rounded-3 text-center" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);">
                  <div class="small text-muted-soft">Tickets Sold</div>
                  <div class="h5 fw-bold text-white mb-0" id="esCancelTicketCount"><i class="bi bi-arrow-repeat spin"></i></div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="p-3 rounded-3 text-center" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2);">
                  <div class="small text-muted-soft">Gross Refund Due</div>
                  <div class="h5 fw-bold text-danger mb-0" id="esCancelRevenueSum"><i class="bi bi-arrow-repeat spin"></i></div>
                </div>
              </div>
            </div>

            <!-- Warning Notice -->
            <div class="alert alert-danger py-2 px-3 mb-3 small d-flex align-items-start gap-2" style="background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.3); border-radius:10px;">
              <i class="bi bi-exclamation-triangle-fill text-danger fs-5 mt-1"></i>
              <div style="line-height:1.45;">
                <strong>What happens when you confirm:</strong>
                <ul class="mb-0 ps-3 mt-1">
                  <li>The event status changes to <code>CANCELLED</code> across the entire platform.</li>
                  <li>Ticket sales cease immediately and discovery pages hide checkout.</li>
                  <li>All attendee admission QR codes are instantly <strong>voided</strong> for gate check-in.</li>
                  <li>A <strong>PayHere Refund Audit Manifest</strong> is generated with itemized buyer details.</li>
                </ul>
              </div>
            </div>

            <!-- Reason Select -->
            <div class="mb-3">
              <label class="form-label small fw-semibold text-white">Cancellation Reason <span class="text-danger">*</span></label>
              <select class="form-select text-white" id="esCancelReasonSelect" style="background:#1b1e2c; border-color:rgba(255,255,255,0.15);">
                <option value="">-- Select reason for event cancellation --</option>
                <option value="Force Majeure / Extreme Weather">Force Majeure / Extreme Weather</option>
                <option value="Artist / Keynote Speaker Unavailability">Artist / Keynote Speaker Unavailability</option>
                <option value="Venue Emergency / Infrastructure Failure">Venue Emergency / Infrastructure Failure</option>
                <option value="Scheduling Conflict / Date Postponement">Scheduling Conflict / Date Postponement</option>
                <option value="Low Registration / Commercial Feasibility">Low Registration / Commercial Feasibility</option>
                <option value="Administrative / Organizational Decision">Administrative / Organizational Decision</option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label small fw-semibold text-white">Additional Notes (Optional)</label>
              <textarea class="form-control text-white" id="esCancelNotesInput" rows="2" placeholder="Provide extra context for attendees and audit records..." style="background:#1b1e2c; border-color:rgba(255,255,255,0.15);"></textarea>
            </div>

            <!-- Safety Typing Confirmation -->
            <div class="p-3 rounded-3" style="background:rgba(0,0,0,0.3); border:1px solid rgba(239,68,68,0.25);">
              <label class="form-label small fw-bold text-danger mb-1">
                Security Confirmation: Type <span class="badge bg-danger font-monospace">CANCEL</span> to proceed
              </label>
              <input type="text" class="form-control font-monospace text-uppercase text-white" id="esCancelConfirmInput" placeholder="Type CANCEL" style="background:#1b1e2c; border-color:rgba(239,68,68,0.5); font-weight:700; letter-spacing:1px;" autocomplete="off">
              <div class="small text-muted-soft mt-1" style="font-size:0.75rem;">
                The confirm button will remain disabled until "CANCEL" is typed and a reason is chosen.
              </div>
            </div>
          </div>

          <div class="modal-footer border-0 pt-0 px-4 pb-4 d-flex justify-content-between">
            <button type="button" class="btn btn-quiet btn-sm" data-bs-dismiss="modal">Aborted / Keep Event</button>
            <button type="button" class="btn btn-danger btn-sm px-4 fw-bold" id="esExecuteCancelBtn" disabled>
              <i class="bi bi-x-circle-fill me-1"></i> Confirm Event Cancellation
            </button>
          </div>
        </div>
      </div>
    `;

    cancelModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    cancelModalInstance.show();

    // Fetch live bookings to give accurate impact figures
    let bookingsList = [];
    try {
      const raw = await EventsAPI.getEventBookings(event.id);
      bookingsList = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);
    } catch (err) {
      console.warn('Could not fetch event bookings for safety modal:', err);
    }

    // Filter confirmed/paid bookings only (exclude abandoned/expired cart holds)
    const paidBookings = bookingsList.filter(b => {
      const s = (b.status || 'CONFIRMED').toUpperCase();
      return s === 'CONFIRMED' || s === 'PAID' || (!b.status && Number(b.totalPrice || b.totalAmount || 0) > 0);
    });

    const totalBookings = paidBookings.length;
    const totalTickets = paidBookings.reduce((sum, b) => sum + (b.ticketCount || b.quantity || 1), 0);
    const totalRevenue = paidBookings.reduce((sum, b) => sum + Number(b.totalPrice != null ? b.totalPrice : (b.totalAmount != null ? b.totalAmount : 0)), 0);

    const elBookingCount = document.getElementById('esCancelBookingCount');
    const elTicketCount = document.getElementById('esCancelTicketCount');
    const elRevenueSum = document.getElementById('esCancelRevenueSum');

    if (elBookingCount) elBookingCount.textContent = totalBookings.toLocaleString();
    if (elTicketCount) elTicketCount.textContent = totalTickets.toLocaleString();
    if (elRevenueSum) elRevenueSum.textContent = `LKR ${totalRevenue.toLocaleString()}`;

    // Wire safety checks
    const reasonSelect = document.getElementById('esCancelReasonSelect');
    const confirmInput = document.getElementById('esCancelConfirmInput');
    const executeBtn = document.getElementById('esExecuteCancelBtn');

    function checkSafetyUnlock() {
      const hasReason = reasonSelect && reasonSelect.value.trim().length > 0;
      const hasTyped = confirmInput && confirmInput.value.trim().toUpperCase() === 'CANCEL';
      if (executeBtn) {
        executeBtn.disabled = !(hasReason && hasTyped);
      }
    }

    reasonSelect?.addEventListener('change', checkSafetyUnlock);
    confirmInput?.addEventListener('input', checkSafetyUnlock);

    executeBtn?.addEventListener('click', async () => {
      const reason = reasonSelect.value.trim();
      const notes = document.getElementById('esCancelNotesInput')?.value.trim() || '';
      const fullReason = notes ? `${reason} — ${notes}` : reason;

      executeBtn.disabled = true;
      executeBtn.innerHTML = `<i class="bi bi-arrow-repeat spin me-1"></i> Cancelling & Voiding Passes...`;

      try {
        await EventsAPI.cancelEvent(event.id);

        // Invalidate all related client caches
        if (global.EsCache) {
          global.EsCache.invalidateEvent(event.id);
          global.EsCache.clear('events_search_');
          global.EsCache.clear('org_events_');
          global.EsCache.clear('user_bookings_');
          global.EsCache.invalidateAnalytics();
        }

        cancelModalInstance.hide();
        if (typeof esToast === 'function') {
          esToast('Event successfully cancelled and admission passes voided.', 'success');
        }

        // Open Refund Manifest modal so organizer/admin can immediately execute refunds & notify guests
        openRefundManifestModal(event, bookingsList, fullReason);

        if (typeof onCancelled === 'function') {
          onCancelled(event);
        }
      } catch (err) {
        console.error('Cancellation failed:', err);
        if (typeof esToast === 'function') {
          esToast(err.message || 'Failed to cancel event. Please check your network connection.', 'error');
        }
        executeBtn.disabled = false;
        executeBtn.innerHTML = `<i class="bi bi-x-circle-fill me-1"></i> Confirm Event Cancellation`;
      }
    });
  }

  /**
   * Opens the PayHere Refund Audit Manifest Modal.
   * Displays itemized list of attendees, paid amounts, payment/order references,
   * and provides one-click CSV export and PayHere roster clipboard copying.
   */
  async function openRefundManifestModal(event, bookings = null, reason = '') {
    if (!event || !event.id) return;

    const modalEl = getOrCreateRefundModal();

    modalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-xl">
        <div class="modal-content text-white" style="background:#13151f; border:1px solid rgba(255,255,255,0.12); border-radius:18px; box-shadow:0 25px 60px rgba(0,0,0,0.85);">
          <div class="modal-header border-0 pb-0 pt-4 px-4">
            <div class="d-flex align-items-center gap-3">
              <div style="width:48px; height:48px; border-radius:12px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); display:flex; align-items:center; justify-content:center;">
                <i class="bi bi-receipt-cutoff text-primary fs-3"></i>
              </div>
              <div>
                <h5 class="modal-title fw-bold text-white mb-0">PayHere Refund Audit Manifest</h5>
                <span class="text-muted-soft small">Event: <strong class="text-white">${escapeHtml(event.title || 'Event')}</strong> (ID: #${event.id})</span>
              </div>
            </div>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>

          <div class="modal-body px-4 py-3">
            ${reason ? `
              <div class="p-2 px-3 mb-3 rounded-3 d-flex align-items-center gap-2 small" style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25);">
                <i class="bi bi-info-circle-fill text-danger"></i>
                <span class="text-white"><strong>Cancellation Reason:</strong> ${escapeHtml(reason)}</span>
              </div>
            ` : ''}

            <!-- Summary KPI Cards -->
            <div class="row g-3 mb-3">
              <div class="col-sm-4">
                <div class="p-3 rounded-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
                  <div class="text-muted-soft small">Affected Buyers</div>
                  <div class="h4 fw-bold text-white mb-0" id="esManifestBuyerCount"><i class="bi bi-arrow-repeat spin"></i></div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="p-3 rounded-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08);">
                  <div class="text-muted-soft small">Total Tickets Voided</div>
                  <div class="h4 fw-bold text-white mb-0" id="esManifestTicketCount"><i class="bi bi-arrow-repeat spin"></i></div>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="p-3 rounded-3" style="background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.25);">
                  <div class="text-muted-soft small">Total Refund Obligation</div>
                  <div class="h4 fw-bold text-danger mb-0" id="esManifestRefundTotal"><i class="bi bi-arrow-repeat spin"></i></div>
                </div>
              </div>
            </div>

            <!-- Action Bar -->
            <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center mb-3">
              <div class="input-group" style="max-width:320px;">
                <span class="input-group-text text-muted-soft border-0" style="background:#1b1e2c;"><i class="bi bi-search"></i></span>
                <input type="text" class="form-control text-white border-0" id="esManifestSearch" placeholder="Search attendee, email, ref..." style="background:#1b1e2c;">
              </div>
              <div class="d-flex gap-2 flex-wrap">
                <button type="button" class="btn btn-primary btn-sm" id="esManifestEmailAllBtn" title="Launch default email client with all attendee emails in BCC">
                  <i class="bi bi-send-fill me-1"></i> Email All Attendees (BCC)
                </button>
                <button type="button" class="btn btn-outline-soft btn-sm" id="esManifestCopyEmailsBtn" title="Copy comma-separated attendee email addresses">
                  <i class="bi bi-envelope-at me-1"></i> Copy Email List
                </button>
                <button type="button" class="btn btn-outline-soft btn-sm" id="esManifestCopyRosterBtn" title="Copy formatted text to clipboard for Excel or merchant notes">
                  <i class="bi bi-clipboard me-1 text-primary"></i> Copy PayHere Roster
                </button>
                <button type="button" class="btn btn-outline-soft btn-sm" id="esManifestExportCsvBtn" title="Download spreadsheet for banking and accountant audit">
                  <i class="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
                </button>
                <a href="https://www.payhere.lk/merchant" target="_blank" rel="noopener noreferrer" class="btn btn-quiet btn-sm" title="Open PayHere Merchant Portal">
                  <i class="bi bi-box-arrow-up-right me-1"></i> PayHere Portal
                </a>
              </div>
            </div>

            <!-- Manifest Table -->
            <div class="table-responsive rounded-3" style="max-height:360px; overflow-y:auto; border:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.2);">
              <table class="table table-dark table-hover mb-0" style="font-size:0.85rem;">
                <thead style="background:#1b1e2c; position:sticky; top:0; z-index:2;">
                  <tr class="text-muted-soft">
                    <th class="py-2 px-3">Booking Ref</th>
                    <th class="py-2 px-3">Attendee</th>
                    <th class="py-2 px-3">Contact</th>
                    <th class="py-2 px-3 text-center">Tickets</th>
                    <th class="py-2 px-3 text-end">Amount Due</th>
                    <th class="py-2 px-3">PayHere Order/Ref</th>
                    <th class="py-2 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody id="esManifestTableBody">
                  <tr>
                    <td colspan="7" class="text-center text-muted-soft py-4"><i class="bi bi-arrow-repeat spin"></i> Loading bookings manifest...</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- PayHere Processing Guide Banner -->
            <div class="p-3 mt-3 rounded-3" style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); font-size:0.78rem; line-height:1.5;">
              <div class="fw-bold text-white mb-1"><i class="bi bi-lightbulb me-1 text-warning"></i> PayHere Manual Refund Procedure</div>
              <span class="text-muted-soft">
                Log in to the PayHere Merchant Portal &rarr; <em>Transactions &rarr; Payment Search</em>. Paste the <strong>PayHere Order/Ref</strong> into the search bar, verify the cardholder name and paid LKR sum, and click <em>Refund / Reverse Charge</em>. The funds will be credited to the attendee's issuing bank account within 3 to 7 business days.
              </span>
            </div>
          </div>

          <div class="modal-footer border-0 pt-0 px-4 pb-4 d-flex justify-content-between">
            <button type="button" class="btn btn-outline-soft btn-sm" id="esManifestEmailPreviewBtn">
              <i class="bi bi-envelope me-1"></i> Preview Attendee Notice
            </button>
            <button type="button" class="btn btn-primary btn-sm px-4" data-bs-dismiss="modal">Done / Close</button>
          </div>
        </div>
      </div>
    `;

    refundModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
    refundModalInstance.show();

    // Fetch bookings if not supplied
    let bookingsList = bookings;
    if (!bookingsList) {
      try {
        const raw = await EventsAPI.getEventBookings(event.id);
        bookingsList = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);
      } catch (err) {
        console.warn('Failed to load bookings in manifest modal:', err);
        bookingsList = [];
      }
    }

    // Filter confirmed/paid bookings only (exclude abandoned/expired cart holds)
    const paidBookings = bookingsList.filter(b => {
      const s = (b.status || 'CONFIRMED').toUpperCase();
      return s === 'CONFIRMED' || s === 'PAID' || (!b.status && Number(b.totalPrice || b.totalAmount || 0) > 0);
    });

    // Process manifest items
    const manifestRows = paidBookings.map(b => {
      const ref = b.bookingReference || b.bookingId || ('ES-BK-' + b.id);
      const name = b.userName || b.attendeeName || b.customerName || (b.user && (b.user.fullName || b.user.name)) || 'Registered Attendee';
      const email = b.userEmail || b.attendeeEmail || (b.user && b.user.email) || '—';
      const phone = b.userPhone || b.attendeePhone || (b.user && b.user.phoneNumber) || '—';
      const ticketType = b.ticketTypeName || b.ticketType || 'General';
      const qty = b.ticketCount || b.quantity || 1;
      const amount = Number(b.totalPrice != null ? b.totalPrice : (b.totalAmount != null ? b.totalAmount : 0));
      const payRef = b.paymentId || b.payherePaymentId || b.paymentReference || ref;
      const date = b.createdAt || b.bookingDate ? new Date(b.createdAt || b.bookingDate).toLocaleDateString() : '—';
      const status = (b.status || 'CONFIRMED').toUpperCase();

      return {
        id: b.id,
        ref,
        name,
        email,
        phone,
        ticketType,
        qty,
        amount,
        payRef,
        date,
        status
      };
    });

    const totalBuyers = manifestRows.length;
    const totalTickets = manifestRows.reduce((sum, r) => sum + r.qty, 0);
    const totalRefund = manifestRows.reduce((sum, r) => sum + r.amount, 0);

    const elBuyers = document.getElementById('esManifestBuyerCount');
    const elTickets = document.getElementById('esManifestTicketCount');
    const elRefund = document.getElementById('esManifestRefundTotal');
    if (elBuyers) elBuyers.textContent = totalBuyers.toLocaleString();
    if (elTickets) elTickets.textContent = totalTickets.toLocaleString();
    if (elRefund) elRefund.textContent = `LKR ${totalRefund.toLocaleString()}`;

    // Render table
    function renderTable(filterText = '') {
      const tbody = document.getElementById('esManifestTableBody');
      if (!tbody) return;

      const q = filterText.toLowerCase().trim();
      const filtered = q
        ? manifestRows.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.ref.toLowerCase().includes(q) || r.payRef.toLowerCase().includes(q))
        : manifestRows;

      if (!filtered.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center text-muted-soft py-4">
              ${manifestRows.length === 0 ? 'No paid bookings or tickets found requiring refunds.' : 'No attendees match your search query.'}
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = filtered.map(r => `
        <tr>
          <td class="py-2 px-3 font-monospace text-white">${escapeHtml(r.ref)}</td>
          <td class="py-2 px-3">
            <div class="fw-bold text-white">${escapeHtml(r.name)}</div>
            <div class="small text-muted-soft">${escapeHtml(r.ticketType)}</div>
          </td>
          <td class="py-2 px-3">
            <div class="text-white">${escapeHtml(r.email)}</div>
            <div class="small text-muted-soft">${escapeHtml(r.phone)}</div>
          </td>
          <td class="py-2 px-3 text-center fw-bold text-white">×${r.qty}</td>
          <td class="py-2 px-3 text-end fw-bold text-danger">LKR ${r.amount.toLocaleString()}</td>
          <td class="py-2 px-3 font-monospace small text-primary">${escapeHtml(r.payRef)}</td>
          <td class="py-2 px-3 text-center">
            <button type="button" class="btn btn-quiet btn-sm py-0 px-2" style="font-size:0.75rem;" onclick="navigator.clipboard.writeText('${r.payRef}'); if(typeof esToast==='function')esToast('Copied PayHere ref: ${r.payRef}','info');" title="Copy PayHere Reference">
              <i class="bi bi-copy"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }

    renderTable();

    // Filter listener
    document.getElementById('esManifestSearch')?.addEventListener('input', (e) => {
      renderTable(e.target.value);
    });

    // 1-Click Email All Attendees via mailto: (BCC)
    document.getElementById('esManifestEmailAllBtn')?.addEventListener('click', () => {
      emailAllAttendees(event, manifestRows, reason);
    });

    // Copy Attendee Emails
    document.getElementById('esManifestCopyEmailsBtn')?.addEventListener('click', () => {
      copyAttendeeEmails(manifestRows);
    });

    // CSV Export
    document.getElementById('esManifestExportCsvBtn')?.addEventListener('click', () => {
      exportManifestToCsv(event, manifestRows, reason);
    });

    // PayHere Roster Clipboard Copy
    document.getElementById('esManifestCopyRosterBtn')?.addEventListener('click', () => {
      copyPayHereRoster(event, manifestRows);
    });

    // Attendee Notice Preview
    document.getElementById('esManifestEmailPreviewBtn')?.addEventListener('click', () => {
      showAttendeeNoticePreview(event, reason);
    });
  }

  // Helper: Export to RFC 4180 CSV
  function exportManifestToCsv(event, rows, reason) {
    if (!rows.length) {
      if (typeof esToast === 'function') esToast('No booking records to export.', 'warning');
      return;
    }

    const headers = ['Booking Reference', 'Attendee Name', 'Email', 'Phone', 'Ticket Type', 'Quantity', 'Refund Amount (LKR)', 'PayHere Reference', 'Booking Date', 'Status', 'Cancellation Reason'];
    const csvLines = [headers.join(',')];

    rows.forEach(r => {
      const line = [
        `"${r.ref.replace(/"/g, '""')}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.email.replace(/"/g, '""')}"`,
        `"${r.phone.replace(/"/g, '""')}"`,
        `"${r.ticketType.replace(/"/g, '""')}"`,
        r.qty,
        r.amount,
        `"${r.payRef.replace(/"/g, '""')}"`,
        `"${r.date.replace(/"/g, '""')}"`,
        `"${r.status}"`,
        `"${(reason || 'Event Cancelled').replace(/"/g, '""')}"`
      ];
      csvLines.push(line.join(','));
    });

    const csvBlob = new Blob([csvLines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (event.title || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `EventSphere_Refund_Manifest_${cleanTitle}_${event.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof esToast === 'function') {
      esToast('Refund Manifest CSV downloaded successfully.', 'success');
    }
  }

  // Helper: Copy PayHere Roster to Clipboard
  function copyPayHereRoster(event, rows) {
    if (!rows.length) {
      if (typeof esToast === 'function') esToast('No records to copy.', 'warning');
      return;
    }

    const lines = [
      `EVENTSPHERE REFUND ROSTER — ${event.title || 'Event'} (ID: #${event.id})`,
      `Total Attendees: ${rows.length} | Total Refund: LKR ${rows.reduce((s, r) => s + r.amount, 0).toLocaleString()}`,
      `Generated: ${new Date().toLocaleString()}`,
      '------------------------------------------------------------------------------------------------',
      'ORDER / PAYHERE REF\tATTENDEE\tEMAIL\tAMOUNT (LKR)\tQTY'
    ];

    rows.forEach(r => {
      lines.push(`${r.payRef}\t${r.name}\t${r.email}\tLKR ${r.amount}\t${r.qty}`);
    });

    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      if (typeof esToast === 'function') {
        esToast('PayHere refund roster copied to clipboard!', 'success');
      }
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  }

  // Helper: Launch default mail client with all attendee emails in BCC
  function emailAllAttendees(event, rows, reason) {
    const validEmails = Array.from(new Set(
      (rows || []).map(r => (r.email || '').trim()).filter(e => e && e !== '—' && e.includes('@'))
    ));

    if (!validEmails.length) {
      if (typeof esToast === 'function') esToast('No attendee email addresses found in confirmed bookings.', 'warning');
      return;
    }

    const title = event.title || 'Event';
    const subject = encodeURIComponent(`[EventSphere] Urgent: Cancellation & Refund Notice for "${title}"`);
    const dateStr = event.startDatetime ? new Date(event.startDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled Date';

    const bodyText = `Dear Attendee,\n\n` +
      `We regret to inform you that "${title}", originally scheduled for ${dateStr}, has been cancelled by the event host.\n\n` +
      `Reason: ${reason || 'Unforeseen circumstances'}\n\n` +
      `Important Information for Ticket Holders:\n` +
      `1. All digital admission passes and QR codes for this event have been voided and deactivated.\n` +
      `2. A 100% refund is being processed to your original payment method via PayHere IPG.\n` +
      `3. Refunds typically settle to your bank account within 3 to 7 business days.\n\n` +
      `If you have questions regarding your refund, please reply directly to this notice.\n\n` +
      `Thank you for your understanding,\n` +
      `${event.organizerName || 'Event Host'} & EventSphere Operations`;

    const body = encodeURIComponent(bodyText);
    const bcc = encodeURIComponent(validEmails.join(','));

    // Construct mailto link
    const mailtoUrl = `mailto:?bcc=${bcc}&subject=${subject}&body=${body}`;

    const a = document.createElement('a');
    a.href = mailtoUrl;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (typeof esToast === 'function') {
      esToast(`Opened email client with ${validEmails.length} attendee(s) in BCC.`, 'success');
    }
  }

  // Helper: Copy comma-separated email list to clipboard
  function copyAttendeeEmails(rows) {
    const validEmails = Array.from(new Set(
      (rows || []).map(r => (r.email || '').trim()).filter(e => e && e !== '—' && e.includes('@'))
    ));

    if (!validEmails.length) {
      if (typeof esToast === 'function') esToast('No attendee email addresses found in bookings.', 'warning');
      return;
    }

    const emailStr = validEmails.join(', ');
    navigator.clipboard.writeText(emailStr).then(() => {
      if (typeof esToast === 'function') {
        esToast(`Copied ${validEmails.length} attendee email(s) to clipboard!`, 'success');
      }
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  }

  // Helper: Notice Preview Dialog
  function showAttendeeNoticePreview(event, reason) {
    const title = event.title || 'Event';
    const dateStr = event.startDatetime ? new Date(event.startDatetime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled Date';
    const noticeText = `Subject: [EventSphere] Important: Cancellation Notice for "${title}"\n\n` +
      `Dear Attendee,\n\n` +
      `We regret to inform you that "${title}", originally scheduled for ${dateStr}, has been cancelled by the event host due to: ${reason || 'Unforeseen circumstances'}.\n\n` +
      `What this means for you:\n` +
      `1. All digital admission passes and QR tickets for this event have been voided and deactivated.\n` +
      `2. A 100% refund is being processed to the original card or payment account you used via PayHere IPG.\n` +
      `3. Refunds typically settle within 3 to 7 business days depending on your bank.\n\n` +
      `If you have questions regarding your refund, please reference your Booking Reference number.\n\n` +
      `Thank you for your understanding,\nEventSphere Operations & Host Management`;

    const previewModalEl = document.createElement('div');
    previewModalEl.className = 'modal fade';
    previewModalEl.tabIndex = -1;
    previewModalEl.innerHTML = `
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content text-white" style="background:#13151f; border:1px solid rgba(255,255,255,0.15); border-radius:16px;">
          <div class="modal-header border-0 pb-0">
            <h6 class="modal-title fw-bold text-white"><i class="bi bi-envelope-paper me-2 text-primary"></i>Attendee Notification Dispatch Preview</h6>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body py-3">
            <p class="small text-muted-soft mb-2">You can copy this standardized notification dispatch for customer support, attendee email blast, or SMS announcements:</p>
            <textarea class="form-control font-monospace text-white small" rows="12" readonly style="background:#1b1e2c; border-color:rgba(255,255,255,0.15); font-size:0.8rem; line-height:1.5;">${escapeHtml(noticeText)}</textarea>
          </div>
          <div class="modal-footer border-0 pt-0">
            <button type="button" class="btn btn-quiet btn-sm" data-bs-dismiss="modal">Close</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="navigator.clipboard.writeText(this.closest('.modal-content').querySelector('textarea').value); if(typeof esToast==='function')esToast('Notification text copied!','success');">
              <i class="bi bi-clipboard me-1"></i> Copy Text
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(previewModalEl);
    const bsModal = new bootstrap.Modal(previewModalEl);
    previewModalEl.addEventListener('hidden.bs.modal', () => previewModalEl.remove());
    bsModal.show();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export to global scope
  global.openEventCancellationModal = openEventCancellationModal;
  global.openRefundManifestModal = openRefundManifestModal;

})(typeof window !== 'undefined' ? window : this);
