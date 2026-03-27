// Campaign Calendar JavaScript — Google Calendar Integration

let currentMonth = new Date();
let calendarEvents = [];
let calendarConnected = false;

// Initialize calendar
function initializeCalendar() {
    renderCalendar();
    loadCalendarEvents();
}

// Render calendar grid
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Update month display
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('calendarMonth').textContent = `${monthNames[month]} ${year}`;

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Add previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, 'other-month');
        calendarGrid.appendChild(dayElement);
    }

    // Add current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dayElement = createDayElement(day, isToday ? 'today' : '');

        // Add events for this day
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = calendarEvents.filter(e => e.event_date === dateString);

        if (dayEvents.length > 0) {
            const eventsContainer = document.createElement('div');
            eventsContainer.className = 'calendar-events';

            dayEvents.slice(0, 3).forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.className = `calendar-event ${event.event_type}`;
                eventElement.textContent = event.event_title;
                eventElement.title = event.event_description;
                eventElement.onclick = () => showEventModal(event);
                eventsContainer.appendChild(eventElement);
            });

            if (dayEvents.length > 3) {
                const moreElement = document.createElement('div');
                moreElement.className = 'calendar-event';
                moreElement.textContent = `+${dayEvents.length - 3} más`;
                moreElement.style.background = '#F5F5F5';
                moreElement.style.color = '#737373';
                eventsContainer.appendChild(moreElement);
            }

            dayElement.appendChild(eventsContainer);
        }

        calendarGrid.appendChild(dayElement);
    }

    // Add next month days
    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, 'other-month');
        calendarGrid.appendChild(dayElement);
    }
}

// Create day element
function createDayElement(day, className) {
    const dayElement = document.createElement('div');
    dayElement.className = `calendar-day ${className}`;

    const dayNumber = document.createElement('div');
    dayNumber.className = 'calendar-day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);

    return dayElement;
}

// Get session token from Supabase or localStorage
function getSessionToken() {
    // Try userData stored by dashboard.js
    if (window._pvbUserData?.session_token) return window._pvbUserData.session_token;
    // Fallback to localStorage
    return localStorage.getItem('session_id');
}

// Load calendar events from Google Calendar via Netlify function
async function loadCalendarEvents() {
    const sessionToken = getSessionToken();
    if (!sessionToken) {
        showCalendarConnectPrompt('Inicia sesión para ver tu calendario');
        return;
    }

    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const monthString = `${year}-${month}`;

    try {
        const response = await fetch(`/.netlify/functions/calendar-events?month=${monthString}`, {
            headers: { 'Authorization': `Bearer ${sessionToken}` }
        });

        const data = await response.json();

        if (data.needs_reauth) {
            showCalendarConnectPrompt('Tu sesión de Google Calendar expiró. Reconéctalo en Configuración.');
            return;
        }

        if (!data.connected) {
            showCalendarConnectPrompt();
            return;
        }

        calendarConnected = true;
        hideCalendarConnectPrompt();

        if (data.events) {
            calendarEvents = data.events;
            renderCalendar();
            renderUpcomingEvents();
        }
    } catch (error) {
        console.error('Error loading calendar events:', error);
    }
}

// Show connect prompt when Google Calendar is not linked
function showCalendarConnectPrompt(message) {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;

    // Check if prompt already exists
    if (document.getElementById('calendarConnectPrompt')) return;

    const prompt = document.createElement('div');
    prompt.id = 'calendarConnectPrompt';
    prompt.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 3rem 1.5rem; color: #737373;';
    prompt.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">📅</div>
        <p style="font-size: 1rem; margin-bottom: 0.5rem; color: #333; font-weight: 600;">
            ${message || 'Conecta tu Google Calendar'}
        </p>
        <p style="font-size: 0.85rem; margin-bottom: 1.5rem; color: #888;">
            Visualiza tus reuniones, deadlines y eventos de producción directamente aquí.
        </p>
        <a href="settings.html#integrations"
           style="display: inline-block; padding: 10px 24px; background: #1a1a1a; color: white; border-radius: 8px; text-decoration: none; font-size: 0.85rem; font-weight: 600; transition: opacity 0.2s;"
           onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
            Conectar Google Calendar
        </a>
    `;

    grid.appendChild(prompt);
}

function hideCalendarConnectPrompt() {
    const prompt = document.getElementById('calendarConnectPrompt');
    if (prompt) prompt.remove();
}

// Navigate calendar
function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
    loadCalendarEvents();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
    loadCalendarEvents();
}

function goToToday() {
    currentMonth = new Date();
    renderCalendar();
    loadCalendarEvents();
}

// Show event modal
function showEventModal(event) {
    const modal = document.getElementById('eventModal');

    document.getElementById('modalEventTitle').textContent = event.event_title;
    document.getElementById('modalEventDescription').textContent = event.event_description || 'Sin descripción';
    document.getElementById('modalEventDate').textContent = formatDate(event.event_date);
    document.getElementById('modalEventTime').textContent = event.event_time || 'Todo el día';
    document.getElementById('modalEventType').textContent = formatEventType(event.event_type);
    document.getElementById('modalEventCampaign').textContent = event.campaign_name || 'General';

    const priorityBadge = document.getElementById('modalEventPriority');
    priorityBadge.textContent = event.priority.toUpperCase();
    priorityBadge.className = `event-badge ${event.priority}`;

    // Add Google Calendar link if available
    const modalActions = document.getElementById('modalEventActions');
    if (modalActions && event.google_link) {
        modalActions.innerHTML = `<a href="${event.google_link}" target="_blank" rel="noopener"
            style="display: inline-block; padding: 8px 16px; background: #1a73e8; color: white; border-radius: 6px; text-decoration: none; font-size: 0.8rem;">
            Abrir en Google Calendar ↗
        </a>`;
    } else if (modalActions) {
        modalActions.innerHTML = '';
    }

    modal.classList.add('active');
}

// Close event modal
function closeEventModal() {
    document.getElementById('eventModal').classList.remove('active');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-CL', options);
}

// Format event type
function formatEventType(type) {
    const types = {
        'campaign_start': 'Inicio Campaña',
        'campaign_end': 'Fin Campaña',
        'meeting': 'Reunión',
        'deadline': 'Deadline',
        'milestone': 'Hito'
    };
    return types[type] || type;
}

// Render upcoming events
function renderUpcomingEvents() {
    const container = document.getElementById('upcomingEventsList');
    if (!container) return;

    // Get upcoming events (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = calendarEvents
        .filter(e => {
            const eventDate = new Date(e.event_date + 'T00:00:00');
            return eventDate >= today && eventDate <= nextWeek;
        })
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 5);

    if (upcoming.length === 0) {
        container.innerHTML = '<p style="color: #737373; text-align: center;">No hay eventos próximos</p>';
        return;
    }

    container.innerHTML = '';

    upcoming.forEach(event => {
        const date = new Date(event.event_date + 'T00:00:00');
        const day = date.getDate();
        const month = date.toLocaleDateString('es-CL', { month: 'short' });

        const item = document.createElement('div');
        item.className = 'upcoming-event-item';
        item.onclick = () => showEventModal(event);

        item.innerHTML = `
            <div class="upcoming-event-date">
                <div class="upcoming-event-day">${day}</div>
                <div class="upcoming-event-month">${month}</div>
            </div>
            <div class="upcoming-event-details">
                <div class="upcoming-event-title">${escapeHtml(event.event_title)}</div>
                <div class="upcoming-event-time">
                    ${event.event_time || 'Todo el día'} · ${formatEventType(event.event_type)}
                    ${event.campaign_name ? ` · ${escapeHtml(event.campaign_name)}` : ''}
                </div>
            </div>
        `;

        container.appendChild(item);
    });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export for use in dashboard
window.calendarAPI = {
    initialize: initializeCalendar,
    previousMonth: previousMonth,
    nextMonth: nextMonth,
    goToToday: goToToday,
    closeModal: closeEventModal
};
