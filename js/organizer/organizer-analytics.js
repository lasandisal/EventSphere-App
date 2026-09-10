// =========================================================
// EventSphere — Organizer Analytics & Overview Module
// =========================================================

// Render Dynamic Rolling 6-Month Sales Bar Chart
function renderOrganizerSalesChart(containerId, bookingsList = [], backendMonthly = null) {
  const container = document.getElementById(containerId);
  if (!container) return;

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

  if (Array.isArray(backendMonthly) && backendMonthly.length > 0) {
    backendMonthly.forEach(bm => {
      const match = months.find(m => m.label.toLowerCase() === (bm.month || '').toLowerCase() || m.key === bm.key);
      if (match) {
        match.revenue = Number(bm.revenue || bm.grossRevenue || 0);
        match.tickets = Number(bm.ticketsSold || bm.tickets || 0);
      }
    });
  } else if (Array.isArray(bookingsList) && bookingsList.length > 0) {
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

  const maxRevenue = Math.max(...months.map(m => m.revenue), 0);

  container.innerHTML = months.map((m, idx) => {
    const isCurrent = idx === months.length - 1;
    const pct = maxRevenue > 0 && m.revenue > 0 
      ? Math.max(Math.round((m.revenue / maxRevenue) * 95), 10) 
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

// Render Attendance Mix Donut & Legend
function renderAttendanceMix(ticketCounts = {}) {
  const donutCenter = document.getElementById('orgDonutCenter');
  const legend = document.getElementById('orgAttendanceMixLegend');
  if (!donutCenter || !legend) return;

  const total = Object.values(ticketCounts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    donutCenter.textContent = '0%';
    legend.innerHTML = `<span class="text-muted-soft small">No ticket sales yet</span>`;
    return;
  }

  const colors = ['var(--dusty-rose)', 'var(--lavender)', 'var(--sage)', 'var(--powder-blue)', 'var(--terracotta)'];
  const entries = Object.entries(ticketCounts);
  
  // Primary category percentage in center
  const topPercent = Math.round((entries[0][1] / total) * 100);
  donutCenter.textContent = `${topPercent}%`;

  legend.innerHTML = entries.map(([type, count], idx) => {
    const color = colors[idx % colors.length];
    const pct = Math.round((count / total) * 100);
    return `<span><i class="bi bi-square-fill me-1" style="color:${color};"></i>${type} (${pct}%)</span>`;
  }).join('');
}

// Load Organizer Executive Analytics
let backendAnalyticsEndpointFailed = false;

async function loadOrganizerOverview(forceRefresh = false) {
  const totalEventsEl = document.getElementById('orgTotalEvents');
  const totalTicketsEl = document.getElementById('orgTotalTickets');
  const totalRevenueEl = document.getElementById('orgTotalRevenue');
  const upcomingEventsEl = document.getElementById('orgUpcomingEvents');
  const topEventsBody = document.getElementById('orgTopEventsBody');

  // 1. Try fetching from Backend Organizer Analytics endpoint (/api/v1/organizer/analytics/overview)
  if (!backendAnalyticsEndpointFailed || forceRefresh) {
    try {
      const raw = await OrganizerAPI.getAnalyticsOverview();
      const overview = raw?.data || raw;

      if (overview && (overview.totalEvents != null || overview.totalRevenue != null)) {
        backendAnalyticsEndpointFailed = false;

        if (totalEventsEl) totalEventsEl.textContent = Number(overview.totalEvents || 0).toLocaleString();
        if (totalTicketsEl) totalTicketsEl.textContent = Number(overview.totalTicketsSold || 0).toLocaleString();
        
        const rev = Number(overview.totalRevenue || overview.totalGrossRevenue || 0);
        if (totalRevenueEl) totalRevenueEl.textContent = rev > 0 ? `LKR ${rev.toLocaleString()}` : 'LKR 0';

        if (upcomingEventsEl) upcomingEventsEl.textContent = Number(overview.upcomingEvents || 0).toLocaleString();

        // Top Events
        if (topEventsBody && overview.topEvents) {
          if (!overview.topEvents.length) {
            topEventsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-soft py-4">No events with ticket sales yet.</td></tr>`;
          } else {
            topEventsBody.innerHTML = overview.topEvents.slice(0, 5).map(e => `
              <tr>
                <td data-label="Event"><span class="fw-bold text-white">${e.title}</span></td>
                <td data-label="Date" class="small text-muted-soft">${e.startDatetime ? new Date(e.startDatetime).toLocaleDateString() : 'TBA'}</td>
                <td data-label="Tickets Sold"><span class="fw-semibold text-white">${e.ticketsSold || 0}</span></td>
                <td data-label="Revenue"><strong class="text-white">LKR ${Number(e.revenue || 0).toLocaleString()}</strong></td>
              </tr>`).join('');
          }
        }

        // Ticket Type Mix
        if (overview.ticketTypeDistribution) {
          renderAttendanceMix(overview.ticketTypeDistribution);
        }

        // Monthly sales chart
        renderOrganizerSalesChart('orgRevenueChartBars', window.orgBookingsCache || [], overview.monthlySales);
        return;
      }
    } catch (err) {
      backendAnalyticsEndpointFailed = true;
      console.warn('Backend organizer analytics endpoint not available, falling back to local aggregator:', err.message || err);
    }
  }

  // 2. Resilient Local Aggregator Fallback (using shared cached events & safe batching)
  try {
    const getEventsFn = window.getSharedOrganizerEvents || (async () => {
      const res = await EventsAPI.myEvents({ page: 0, size: 50 });
      return Array.isArray(res) ? res : (res?.data || res?.content || []);
    });

    const events = await getEventsFn(forceRefresh);
    if (totalEventsEl) totalEventsEl.textContent = (events ? events.length : 0).toLocaleString();

    // Upcoming events count
    const now = new Date();
    const upcomingCount = (events || []).filter(e => {
      if (e.status === 'CANCELLED') return false;
      if (!e.startDatetime) return false;
      const d = new Date(e.startDatetime);
      return !isNaN(d.getTime()) && d >= now;
    }).length;

    if (upcomingEventsEl) upcomingEventsEl.textContent = upcomingCount.toLocaleString();

    if (!events || !events.length) {
      if (totalTicketsEl) totalTicketsEl.textContent = '0';
      if (totalRevenueEl) totalRevenueEl.textContent = 'LKR 0';
      if (topEventsBody) {
        topEventsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-soft py-4">No events found.</td></tr>`;
      }
      renderAttendanceMix({});
      renderOrganizerSalesChart('orgRevenueChartBars', []);
      return;
    }

    // Load bookings safely using shared loader
    const getBookingsFn = window.getSharedOrganizerBookings || (async () => []);
    const allBookings = await getBookingsFn(forceRefresh);

    let totalTickets = 0;
    let totalRevenue = 0;
    const ticketTypeCounts = {};
    const eventSalesRankings = [];

    // Map bookings by event
    const bookingsByEvent = {};
    (allBookings || []).forEach(b => {
      if (b.status === 'CANCELLED') return;
      const evId = b.eventId || (b.event && b.event.id);
      if (!evId) return;
      if (!bookingsByEvent[evId]) bookingsByEvent[evId] = [];
      bookingsByEvent[evId].push(b);
    });

    events.forEach(ev => {
      const bList = bookingsByEvent[ev.id] || [];
      let evTickets = 0;
      let evRevenue = 0;

      bList.forEach(b => {
        const qty = Number(b.ticketCount || b.quantity || 1);
        const price = Number(b.totalPrice || b.totalAmount || 0);
        const tType = b.ticketTypeName || b.ticketType || 'General';

        evTickets += qty;
        evRevenue += price;
        ticketTypeCounts[tType] = (ticketTypeCounts[tType] || 0) + qty;
      });

      totalTickets += evTickets;
      totalRevenue += evRevenue;

      eventSalesRankings.push({
        id: ev.id,
        title: ev.title,
        startDatetime: ev.startDatetime,
        ticketsSold: evTickets,
        revenue: evRevenue
      });
    });

    if (totalTicketsEl) totalTicketsEl.textContent = totalTickets.toLocaleString();
    if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue > 0 ? `LKR ${totalRevenue.toLocaleString()}` : 'LKR 0';

    // Top Events Body
    if (topEventsBody) {
      eventSalesRankings.sort((a, b) => b.revenue - a.revenue || b.ticketsSold - a.ticketsSold);
      const top5 = eventSalesRankings.slice(0, 5);
      if (!top5.length || totalTickets === 0) {
        topEventsBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted-soft py-4">No events with ticket sales yet.</td></tr>`;
      } else {
        topEventsBody.innerHTML = top5.map(e => `
          <tr>
            <td data-label="Event"><span class="fw-bold text-white">${e.title}</span></td>
            <td data-label="Date" class="small text-muted-soft">${e.startDatetime ? new Date(e.startDatetime).toLocaleDateString() : 'TBA'}</td>
            <td data-label="Tickets Sold"><span class="fw-semibold text-white">${e.ticketsSold}</span></td>
            <td data-label="Revenue"><strong class="text-white">LKR ${e.revenue.toLocaleString()}</strong></td>
          </tr>`).join('');
      }
    }

    renderAttendanceMix(ticketTypeCounts);
    renderOrganizerSalesChart('orgRevenueChartBars', allBookings);
  } catch (e) {
    console.error('Failed to load organizer analytics:', e);
  }
}
