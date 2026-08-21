// =========================================================
// EventSphere — Admin Analytics & Overview Module
// =========================================================

// Render Real Dynamic Monthly Revenue Bar Chart
function renderMonthlyRevenueChart(containerId, bookingsList = [], backendMonthly = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Build the last 6 calendar months (e.g. Mar, Apr, May, Jun, Jul, Aug)
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('default', { month: 'short' });
    months.push({
      key: monthKey,
      label: monthLabel,
      year: d.getFullYear(),
      revenue: 0,
      tickets: 0
    });
  }

  // 1. If backend provided monthly breakdown, map it
  if (Array.isArray(backendMonthly) && backendMonthly.length > 0) {
    backendMonthly.forEach(bm => {
      const match = months.find(m => m.label.toLowerCase() === (bm.month || '').toLowerCase() || m.key === bm.key);
      if (match) {
        match.revenue = Number(bm.revenue || bm.grossRevenue || 0);
        match.tickets = Number(bm.ticketsSold || bm.tickets || 0);
      }
    });
  } else if (Array.isArray(bookingsList) && bookingsList.length > 0) {
    // 2. Otherwise calculate from all bookings
    bookingsList.forEach(b => {
      if (b.status === 'CANCELLED') return;
      const dateVal = b.createdAt || b.bookingDate || b.date;
      if (!dateVal) return;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const found = months.find(m => m.key === key);
      if (found) {
        found.revenue += Number(b.totalPrice || b.totalAmount || 0);
        found.tickets += Number(b.ticketCount || b.quantity || 1);
      }
    });
  }

  // Calculate scaling
  const maxRevenue = Math.max(...months.map(m => m.revenue), 0);

  container.innerHTML = months.map((m, idx) => {
    const isCurrent = idx === months.length - 1;
    const pct = maxRevenue > 0 && m.revenue > 0 
      ? Math.max(Math.round((m.revenue / maxRevenue) * 95), 12) 
      : 8;
    const barClass = isCurrent ? 'bar' : 'bar sage';
    const revFormatted = m.revenue > 0 ? `LKR ${m.revenue.toLocaleString()}` : 'LKR 0';

    return `
      <div class="${barClass}" style="height:${pct}%;" title="${m.label}: ${revFormatted}">
        <span class="bar-tooltip">${m.label}: ${revFormatted} (${m.tickets} tix)</span>
        <span class="bar-label">${m.label}</span>
      </div>`;
  }).join('');
}

// Render Popular Categories Breakdown
async function renderPopularCategoriesBreakdown() {
  const catBreakdownEl = document.getElementById('dashCategoriesBreakdown');
  if (!catBreakdownEl) return;

  try {
    const [catsRes, eventsRes] = await Promise.allSettled([
      CategoriesAPI.getAll(),
      EventsAPI.searchPublished({ page: 0, size: 50 })
    ]);

    const catsList = catsRes.status === 'fulfilled' ? (Array.isArray(catsRes.value) ? catsRes.value : (catsRes.value?.data || [])) : [];
    const eventsList = eventsRes.status === 'fulfilled' ? (Array.isArray(eventsRes.value) ? eventsRes.value : (eventsRes.value?.data || eventsRes.value?.content || [])) : [];

    if (!catsList.length) {
      catBreakdownEl.innerHTML = `<div class="text-muted-soft small">No categories registered yet.</div>`;
      return;
    }

    const catCounts = {};
    eventsList.forEach(e => {
      const cName = e.categoryName || (e.category && e.category.name) || 'General';
      catCounts[cName] = (catCounts[cName] || 0) + 1;
    });

    catBreakdownEl.innerHTML = catsList.slice(0, 5).map(c => {
      const count = catCounts[c.name] || 0;
      const icon = c.icon || c.emoji || '🏷️';
      return `
        <div class="p-2 rounded-3 d-flex justify-content-between align-items-center" style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);">
          <span class="small fw-semibold text-white">${icon} ${c.name}</span>
          <span class="pill-badge pill-beige">${count} events</span>
        </div>`;
    }).join('');
  } catch (e) {
    console.error('Failed to load categories breakdown:', e);
    if (catBreakdownEl) catBreakdownEl.innerHTML = `<div class="text-muted-soft small">Could not load categories.</div>`;
  }
}

// Load Executive Dashboard Analytics
async function loadDashboardAnalytics() {
  const totalUsersEl = document.getElementById('dashTotalUsers');
  const totalOrgsEl = document.getElementById('dashTotalOrganizers');
  const orgsSubEl = document.getElementById('dashOrganizersSub');
  const totalRevEl = document.getElementById('dashTotalRevenue');
  const totalTixEl = document.getElementById('dashTotalTickets');
  const kycBannerText = document.getElementById('pendingKycBannerText');
  const topEventsBody = document.getElementById('dashTopEventsBody');
  const topOrgsBody = document.getElementById('dashTopOrganizersBody');

  // Render categories in parallel
  renderPopularCategoriesBreakdown();

  // 1. Try fetching directly from backend AdminAnalyticsController (/admin/analytics/overview)
  try {
    const raw = await AdminAPI.getAnalyticsOverview();
    const overview = raw?.data || raw;

    if (overview && (overview.totalUsers != null || overview.totalOrganizers != null || overview.topPerformingEvents != null)) {
      console.log('Loaded backend analytics overview:', overview);

      // KPI Cards
      if (totalUsersEl) totalUsersEl.textContent = Number(overview.totalUsers || 0).toLocaleString();
      if (totalOrgsEl) totalOrgsEl.textContent = Number(overview.totalOrganizers || 0).toLocaleString();
      
      const pendingCount = Number(overview.pendingOrganizersCount || 0);
      if (orgsSubEl) {
        orgsSubEl.textContent = pendingCount > 0 ? `${pendingCount} Pending Approval` : 'All Verified';
      }
      if (kycBannerText) {
        kycBannerText.textContent = pendingCount > 0 
          ? `${pendingCount} organizer application(s) awaiting verification.`
          : 'All organizer KYC applications are up to date.';
      }

      const grossRev = Number(overview.totalGrossRevenue || 0);
      if (totalRevEl) totalRevEl.textContent = grossRev > 0 ? `LKR ${grossRev.toLocaleString()}` : 'LKR 0';
      if (totalTixEl) totalTixEl.textContent = Number(overview.totalTicketsSold || 0).toLocaleString();

      // Top Performing Events Leaderboard
      const topEvents = overview.topPerformingEvents || [];
      if (topEventsBody) {
        if (!topEvents.length) {
          topEventsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-soft py-4">No event sales recorded yet.</td></tr>`;
        } else {
          topEventsBody.innerHTML = topEvents.slice(0, 5).map((e, index) => {
            const medal = index === 0 ? '🥇 ' : (index === 1 ? '🥈 ' : (index === 2 ? '🥉 ' : ''));
            const evId = e.eventId || e.id || '';
            const tix = Number(e.ticketsSold || e.ticketCount || 0);
            const rev = Number(e.totalRevenue || e.grossRevenue || 0);
            const title = (e.title || 'Event').replace(/'/g, "\\'").replace(/"/g, '&quot;');

            return `
              <tr>
                <td data-label="Event">
                  <div class="fw-bold text-white">${medal}${e.title}</div>
                  <div class="small text-muted-soft">${e.organizerName || 'Organizer'} • <span class="pill-badge pill-beige" style="font-size:0.65rem;">${e.categoryName || 'General'}</span></div>
                </td>
                <td data-label="Tickets Sold">
                  <span class="fw-semibold text-white">${tix.toLocaleString()} tickets</span>
                </td>
                <td data-label="Gross Income">
                  <strong class="text-white">LKR ${rev.toLocaleString()}</strong>
                </td>
                <td data-label="Action" class="text-end">
                  ${evId ? `
                    <button class="btn btn-quiet btn-sm" onclick="openEventAttendeesModal(${evId}, '${title}')" title="Inspect Attendees">
                      <i class="bi bi-people"></i>
                    </button>
                  ` : ''}
                </td>
              </tr>`;
          }).join('');
        }
      }

      // Top Organizers Leaderboard
      const topOrgs = overview.topOrganizers || [];
      if (topOrgsBody) {
        if (!topOrgs.length) {
          topOrgsBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted-soft py-4">No organizer stats recorded yet.</td></tr>`;
        } else {
          topOrgsBody.innerHTML = topOrgs.slice(0, 5).map(o => {
            const evCount = Number(o.eventsCount || o.events || 0);
            const tix = Number(o.ticketsSold || 0);
            const rev = Number(o.totalRevenue || 0);
            return `
              <tr>
                <td data-label="Organizer">
                  <div class="fw-bold text-white">${o.organizerName}</div>
                  <div class="small text-muted-soft">${tix.toLocaleString()} tickets sold</div>
                </td>
                <td data-label="Events">
                  <span class="pill-badge pill-beige">${evCount} Events</span>
                </td>
                <td data-label="Total Revenue">
                  <strong class="text-white">LKR ${rev.toLocaleString()}</strong>
                </td>
              </tr>`;
          }).join('');
        }
      }

      // Monthly Revenue Chart
      renderMonthlyRevenueChart('dashRevenueChartBars', allAttendeesCache, overview.monthlyRevenue);

      return;
    }
  } catch (err) {
    console.warn('Backend analytics endpoint not reachable, running local aggregator fallback:', err);
  }

  // 2. Local Fallback Aggregator if overview endpoint returned empty
  try {
    const [usersRes, orgsRes, eventsRes] = await Promise.allSettled([
      AdminAPI.getUsers(),
      AdminAPI.getAllOrganizers(),
      EventsAPI.searchPublished({ page: 0, size: 50 })
    ]);

    const usersList = usersRes.status === 'fulfilled' ? (Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value?.data || usersRes.value?.content || [])) : [];
    const orgsList = orgsRes.status === 'fulfilled' ? (Array.isArray(orgsRes.value) ? orgsRes.value : (orgsRes.value?.data || orgsRes.value?.content || [])) : [];
    const eventsList = eventsRes.status === 'fulfilled' ? (Array.isArray(eventsRes.value) ? eventsRes.value : (eventsRes.value?.data || eventsRes.value?.content || [])) : [];

    let totalPlatformRevenue = 0;
    let totalPlatformTickets = 0;
    const eventStats = [];
    const organizerRevenueMap = {};

    const bookingFetchPromises = eventsList.map(async (ev) => {
      try {
        const raw = await EventsAPI.getEventBookings(ev.id);
        const bookings = Array.isArray(raw) ? raw : (raw?.data || raw?.content || []);
        
        let eventRevenue = 0;
        let eventTickets = 0;

        bookings.forEach(b => {
          const qty = b.ticketCount || b.quantity || 1;
          const price = Number(b.totalPrice || b.totalAmount || 0);
          eventTickets += qty;
          eventRevenue += price;
        });

        totalPlatformRevenue += eventRevenue;
        totalPlatformTickets += eventTickets;

        const orgKey = ev.organizerName || 'Independent Host';
        if (!organizerRevenueMap[orgKey]) {
          organizerRevenueMap[orgKey] = { name: orgKey, events: 0, tickets: 0, revenue: 0 };
        }
        organizerRevenueMap[orgKey].events += 1;
        organizerRevenueMap[orgKey].tickets += eventTickets;
        organizerRevenueMap[orgKey].revenue += eventRevenue;

        eventStats.push({
          id: ev.id,
          title: ev.title,
          organizer: ev.organizerName || '—',
          category: ev.categoryName || 'General',
          ticketsSold: eventTickets,
          revenue: eventRevenue
        });
      } catch (err) {
        eventStats.push({
          id: ev.id,
          title: ev.title,
          organizer: ev.organizerName || '—',
          category: ev.categoryName || 'General',
          ticketsSold: 0,
          revenue: 0
        });
      }
    });

    await Promise.all(bookingFetchPromises);

    if (totalUsersEl) totalUsersEl.textContent = usersList.length.toLocaleString();
    const approvedOrgsCount = orgsList.filter(o => isOrgApproved(o.status)).length;
    const pendingOrgsCount = orgsList.filter(o => isOrgPending(o.status)).length;

    if (totalOrgsEl) totalOrgsEl.textContent = (approvedOrgsCount || orgsList.length).toLocaleString();
    if (orgsSubEl) orgsSubEl.textContent = pendingOrgsCount > 0 ? `${pendingOrgsCount} Pending Approval` : 'All Verified';
    if (kycBannerText) {
      kycBannerText.textContent = pendingOrgsCount > 0 
        ? `${pendingOrgsCount} organizer application(s) awaiting verification.`
        : 'All organizer KYC applications are up to date.';
    }

    if (totalRevEl) totalRevEl.textContent = totalPlatformRevenue > 0 ? `LKR ${totalPlatformRevenue.toLocaleString()}` : 'LKR 0';
    if (totalTixEl) totalTixEl.textContent = totalPlatformTickets.toLocaleString();

    if (topEventsBody) {
      eventStats.sort((a, b) => b.revenue - a.revenue || b.ticketsSold - a.ticketsSold);
      const top5Events = eventStats.slice(0, 5);
      if (!top5Events.length) {
        topEventsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-soft py-4">No published events found</td></tr>`;
      } else {
        topEventsBody.innerHTML = top5Events.map((e, index) => {
          const medal = index === 0 ? '🥇 ' : (index === 1 ? '🥈 ' : (index === 2 ? '🥉 ' : ''));
          const escapedTitle = (e.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
          return `
            <tr>
              <td data-label="Event">
                <div class="fw-bold text-white">${medal}${e.title}</div>
                <div class="small text-muted-soft">${e.organizer} • <span class="pill-badge pill-beige" style="font-size:0.65rem;">${e.category}</span></div>
              </td>
              <td data-label="Tickets Sold" class="text-white">${e.ticketsSold} tickets</td>
              <td data-label="Gross Income"><strong class="text-white">LKR ${e.revenue.toLocaleString()}</strong></td>
              <td data-label="Action" class="text-end">
                <button class="btn btn-quiet btn-sm" onclick="openEventAttendeesModal(${e.id}, '${escapedTitle}')">
                  <i class="bi bi-people"></i>
                </button>
              </td>
            </tr>`;
        }).join('');
      }
    }

    if (topOrgsBody) {
      const orgRankings = Object.values(organizerRevenueMap);
      orgRankings.sort((a, b) => b.revenue - a.revenue || b.events - a.events);
      const top5Orgs = orgRankings.slice(0, 5);
      if (!top5Orgs.length) {
        topOrgsBody.innerHTML = `<tr><td colspan="3" class="text-center text-muted-soft py-4">No organizer activity yet</td></tr>`;
      } else {
        topOrgsBody.innerHTML = top5Orgs.map(o => `
          <tr>
            <td data-label="Organizer">
              <div class="fw-bold text-white">${o.name}</div>
              <div class="small text-muted-soft">${o.tickets} tickets sold</div>
            </td>
            <td data-label="Events"><span class="pill-badge pill-beige">${o.events} Events</span></td>
            <td data-label="Total Revenue"><strong class="text-white">LKR ${o.revenue.toLocaleString()}</strong></td>
          </tr>`).join('');
      }
    }

    renderMonthlyRevenueChart('dashRevenueChartBars', allAttendeesCache);
  } catch (err) {
    console.error('Failed to load local analytics fallback:', err);
  }
}
