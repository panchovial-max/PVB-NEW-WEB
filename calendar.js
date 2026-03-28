// Campaign Calendar JavaScript — Google Calendar Integration

let currentMonth = new Date();
let calendarEvents = [];
let calendarConnected = false;

// Festivales de publicidad y cine 2026 — se muestran siempre
const FESTIVAL_EVENTS = [
    // Enero
    { event_id: 'fest-sundance', event_title: 'Sundance Film Festival', event_description: 'Festival de cine independiente más importante del mundo. Park City, Utah, USA.', event_date: '2026-01-22', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Park City, Utah' },
    // Febrero
    { event_id: 'fest-berlinale', event_title: 'Berlinale', event_description: 'Festival Internacional de Cine de Berlín. Competencia oficial + European Film Market.', event_date: '2026-02-12', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Berlín, Alemania' },
    // Marzo
    { event_id: 'fest-sxsw', event_title: 'SXSW Film & Interactive', event_description: 'South by Southwest — cine, música, tecnología y creatividad. Austin, Texas.', event_date: '2026-03-13', event_time: 'All day', event_type: 'milestone', priority: 'normal', campaign_name: 'Austin, Texas' },
    // Abril
    { event_id: 'fest-mip', event_title: 'MIP TV / MIPTV', event_description: 'Mercado internacional de contenido audiovisual. Cannes, Francia.', event_date: '2026-04-13', event_time: 'All day', event_type: 'meeting', priority: 'normal', campaign_name: 'Cannes, Francia' },
    // Mayo
    { event_id: 'fest-cannes', event_title: 'Festival de Cannes', event_description: 'El festival de cine más prestigioso del mundo. Palme d\'Or + Marché du Film.', event_date: '2026-05-13', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Cannes, Francia' },
    // Junio
    { event_id: 'fest-canneslions', event_title: 'Cannes Lions', event_description: 'Festival Internacional de Creatividad. La cumbre mundial de publicidad y comunicación.', event_date: '2026-06-15', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Cannes, Francia' },
    { event_id: 'fest-annecy', event_title: 'Annecy Animation Festival', event_description: 'Festival y mercado de animación más grande del mundo.', event_date: '2026-06-15', event_time: 'All day', event_type: 'milestone', priority: 'normal', campaign_name: 'Annecy, Francia' },
    // Julio
    { event_id: 'fest-locarno', event_title: 'Locarno Film Festival', event_description: 'Festival de cine suizo de autor. Piazza Grande al aire libre.', event_date: '2026-08-05', event_time: 'All day', event_type: 'milestone', priority: 'normal', campaign_name: 'Locarno, Suiza' },
    // Agosto
    { event_id: 'fest-sanfic', event_title: 'SANFIC', event_description: 'Santiago Festival Internacional de Cine. El principal festival de cine de Chile.', event_date: '2026-08-17', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Santiago, Chile' },
    // Septiembre
    { event_id: 'fest-venice', event_title: 'Venice Film Festival', event_description: 'La Mostra de Venecia — el festival de cine más antiguo del mundo. León de Oro.', event_date: '2026-09-02', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Venecia, Italia' },
    { event_id: 'fest-tiff', event_title: 'TIFF', event_description: 'Toronto International Film Festival. Plataforma clave para lanzamientos de Oscar.', event_date: '2026-09-10', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Toronto, Canadá' },
    { event_id: 'fest-elojo', event_title: 'El Ojo de Iberoamérica', event_description: 'El festival de creatividad publicitaria más importante de Latinoamérica.', event_date: '2026-09-29', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Buenos Aires, Argentina' },
    // Octubre
    { event_id: 'fest-ficvaldivia', event_title: 'FICValdivia', event_description: 'Festival Internacional de Cine de Valdivia. Referente del cine de autor en Chile.', event_date: '2026-10-05', event_time: 'All day', event_type: 'milestone', priority: 'high', campaign_name: 'Valdivia, Chile' },
    { event_id: 'fest-fiap', event_title: 'FIAP', event_description: 'Festival Iberoamericano de la Publicidad. Premios a la mejor creatividad regional.', event_date: '2026-10-19', event_time: 'All day', event_type: 'milestone', priority: 'normal', campaign_name: 'Miami, USA' },
    // Noviembre
    { event_id: 'fest-idfa', event_title: 'IDFA', event_description: 'International Documentary Film Festival Amsterdam. El mayor festival de documental.', event_date: '2026-11-18', event_time: 'All day', event_type: 'milestone', priority: 'normal', campaign_name: 'Amsterdam, Holanda' },
    { event_id: 'fest-effie', event_title: 'Effie Awards LatAm', event_description: 'Premios a la efectividad en marketing y publicidad en Latinoamérica.', event_date: '2026-11-10', event_time: 'All day', event_type: 'milestone', priority: 'normal', campaign_name: 'CDMX, México' },
    // Diciembre
    { event_id: 'fest-fidocs', event_title: 'FIDOCS', event_description: 'Festival Internacional de Documentales de Santiago. Cine documental chileno e internacional.', event_date: '2026-12-01', event_time: 'All day', event_type: 'milestone', priority: 'normal', campaign_name: 'Santiago, Chile' },
];

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
        calendarEvents = [...FESTIVAL_EVENTS];
        renderCalendar();
        renderUpcomingEvents();
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
            // Show festivals even without Google Calendar
            calendarEvents = [...FESTIVAL_EVENTS];
            renderCalendar();
            renderUpcomingEvents();
            showCalendarConnectPrompt();
            return;
        }

        calendarConnected = true;
        hideCalendarConnectPrompt();

        if (data.events) {
            // Merge Google Calendar events with festivals
            calendarEvents = [...data.events, ...FESTIVAL_EVENTS];
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
