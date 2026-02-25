// =========================
// NAVIGATION
// =========================
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');
const scrollProgress = document.getElementById('scrollProgress');
const backToTop = document.getElementById('backToTop');

// Scroll progress bar
window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    scrollProgress.style.width = scrolled + '%';
});

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Back to top button visibility
    if (window.scrollY > 500) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

// Back to top functionality
backToTop.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Hamburger menu toggle
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close menu when clicking nav links
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth scroll for all anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// =========================
// ANIMATED STATS COUNTER
// =========================
const statNumbers = document.querySelectorAll('.stat-number');
let statsAnimated = false;

const animateStats = () => {
    statNumbers.forEach(stat => {
        const target = parseFloat(stat.dataset.target);
        const isDecimal = target % 1 !== 0;
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                stat.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                stat.textContent = isDecimal ? target.toFixed(1) : target;
            }
        };

        updateCounter();
    });
};

// =========================
// INTERSECTION OBSERVER FOR ANIMATIONS
// =========================
const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
                entry.target.classList.add('aos-animate');
            }, delay);
            
            // Animate stats when visible
            if (entry.target.closest('.stats') && !statsAnimated) {
                animateStats();
                statsAnimated = true;
            }
        }
    });
}, observerOptions);

// Observe all elements with data-aos attribute
document.querySelectorAll('[data-aos]').forEach(el => {
    observer.observe(el);
});

// Observe stats section
const statsSection = document.querySelector('.stats');
if (statsSection) {
    observer.observe(statsSection);
}

// =========================
// FORM HANDLING
// =========================
const contactForm = document.getElementById('contactForm');
const successModal = document.getElementById('successModal');
const modalClose = document.getElementById('modalClose');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const company = document.getElementById('company').value;
    const message = document.getElementById('message').value;
    
    // Validate form
    if (!name || !email || !company || !message) {
        alert('Please fill in all fields');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        return;
    }
    
    // Simulate form submission
    console.log('Form submitted:', { name, email, company, message });
    
    // Show success modal
    successModal.classList.add('active');
    
    // Reset form
    contactForm.reset();
    
    // Add success animation to modal
    const modalContent = successModal.querySelector('.modal-content');
    modalContent.style.animation = 'modalFadeIn 0.3s ease';
});

// Close modal
modalClose.addEventListener('click', () => {
    successModal.classList.remove('active');
});

// Close modal when clicking outside
successModal.addEventListener('click', (e) => {
    if (e.target === successModal) {
        successModal.classList.remove('active');
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && successModal.classList.contains('active')) {
        successModal.classList.remove('active');
    }
});

// =========================
// BUTTON INTERACTIONS
// =========================
const buttons = document.querySelectorAll('.btn');

buttons.forEach(button => {
    // Add ripple effect on click
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    });
});

// Add ripple CSS
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
    .btn {
        position: relative;
        overflow: hidden;
    }
    
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyle);

// =========================
// PARALLAX EFFECT
// =========================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero-title');
    
    if (hero) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - scrolled / 600;
    }
});

// =========================
// CARD TILT EFFECT
// =========================
const cards = document.querySelectorAll('.service-card, .project-card');

cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
    });
});

// =========================
// CURSOR FOLLOWER (DESKTOP ONLY)
// =========================
if (window.innerWidth > 768) {
    const cursorDot = document.createElement('div');
    cursorDot.classList.add('cursor-dot');
    document.body.appendChild(cursorDot);

    let mouseX = 0, mouseY = 0;
    let dotX = 0, dotY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dotX = e.clientX;
        dotY = e.clientY;
    });

    function animateCursor() {
        // Smooth cursor follow
        dotX += (mouseX - dotX) * 0.15;
        dotY += (mouseY - dotY) * 0.15;

        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';

        requestAnimationFrame(animateCursor);
    }

    animateCursor();

    // Add cursor styles
    const cursorStyle = document.createElement('style');
    cursorStyle.textContent = `
        body {
            cursor: none;
        }

        .cursor-dot {
            width: 20px;
            height: 20px;
            background: #c9a96e;
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
            transition: transform 0.2s ease;
        }

        .btn:hover,
        .nav-link:hover,
        a:hover {
            cursor: none;
        }

        body:hover .cursor-dot {
            transform: translate(-50%, -50%) scale(1.5);
        }
    `;
    document.head.appendChild(cursorStyle);
}

// =========================
// ACTIVE SECTION HIGHLIGHT
// =========================
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    
    sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
});

// =========================
// PERFORMANCE OPTIMIZATION
// =========================
// Lazy load images when implemented
const lazyImages = document.querySelectorAll('img[data-src]');
const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
        }
    });
});

lazyImages.forEach(img => imageObserver.observe(img));

// =========================
// CONSOLE EASTER EGG
// =========================
console.log('%c🎨 PVB ESTUDIO CREATIVO', 'font-size: 48px; font-weight: 900; color: #1A1A1A;');
console.log('%cEXCELENCIA VISUAL SIN PERDER EL ALMA', 'font-size: 24px; font-weight: 700; color: #000000;');
console.log('%c¿Quieres trabajar con nosotros? info@panchovial.com', 'font-size: 14px; color: #6B6B6B;');

// =========================
// AGENDA CALENDAR
// =========================
let currentAgendaMonth = new Date();

function initAgendaCalendar() {
    const calendarGrid = document.getElementById('agendaCalendar');
    if (!calendarGrid) return;
    
    renderAgendaCalendar();
    
    // Calendar navigation
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');
    const todayBtn = document.getElementById('todayBtn');
    const bookBtn = document.getElementById('bookAppointment');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentAgendaMonth.setMonth(currentAgendaMonth.getMonth() - 1);
            renderAgendaCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentAgendaMonth.setMonth(currentAgendaMonth.getMonth() + 1);
            renderAgendaCalendar();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentAgendaMonth = new Date();
            renderAgendaCalendar();
        });
    }
    
    if (bookBtn) {
        bookBtn.addEventListener('click', () => {
            const whatsappLink = 'https://wa.me/56944328662?text=Hola!%20Quiero%20agendar%20una%20consulta';
            window.open(whatsappLink, '_blank');
        });
    }
    
    // Load Notion events if connected
    loadNotionEvents();
}

// Load events from Notion Calendar
async function loadNotionEvents() {
    try {
        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) return;
        
        const response = await fetch('http://localhost:8001/api/notion/events', {
            headers: {
                'X-Session-ID': sessionId
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.events && data.events.length > 0) {
                // Merge Notion events with calendar
                mergeNotionEvents(data.events);
            }
        }
    } catch (error) {
        console.log('Notion not connected or error loading events:', error);
    }
}

// Sync event to Notion
async function syncEventToNotion(eventData) {
    try {
        const sessionId = localStorage.getItem('session_id');
        if (!sessionId) return false;
        
        const response = await fetch('http://localhost:8001/api/notion/sync-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionId
            },
            body: JSON.stringify(eventData)
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.success;
        }
        return false;
    } catch (error) {
        console.error('Error syncing to Notion:', error);
        return false;
    }
}

// Merge Notion events into calendar
function mergeNotionEvents(events) {
    // Add events to the calendar display
    // This would be called when rendering the calendar
    window.notionEvents = events;
}

async function renderAgendaCalendar() {
    const calendarGrid = document.getElementById('agendaCalendar');
    const monthDisplay = document.getElementById('currentMonth');
    if (!calendarGrid || !monthDisplay) return;
    
    const year = currentAgendaMonth.getFullYear();
    const month = currentAgendaMonth.getMonth();
    
    // Update month display
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    monthDisplay.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'agenda-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });
    
    // Fetch availability from API
    let availableDays = [];
    let occupiedDays = [];
    let appointments = [];
    
    try {
        // Calculate start and end dates for the month
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];
        
        const response = await fetch(
            `http://localhost:8001/api/calendar/availability?start_date=${startDateStr}&end_date=${endDateStr}`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                availableDays = data.available_days || [];
                occupiedDays = data.occupied_days || [];
                
                // Extract appointments from occupied days
                occupiedDays.forEach(day => {
                    if (day.appointments) {
                        appointments.push(...day.appointments);
                    }
                });
            }
        }
    } catch (error) {
        console.log('Calendar API not available, using default display:', error);
    }
    
    // Create a map of day status
    const dayStatus = {};
    availableDays.forEach(date => {
        dayStatus[date] = 'available';
    });
    occupiedDays.forEach(day => {
        dayStatus[day.date] = 'occupied';
    });
    
    // Add previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createAgendaDay(day, 'other-month', false, null, null);
        calendarGrid.appendChild(dayElement);
    }
    
    // Add current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = date.toDateString() === today.toDateString();
        const dateStr = date.toISOString().split('T')[0];
        const status = dayStatus[dateStr] || 'unavailable';
        const dayAppointments = appointments.filter(apt => apt.date === dateStr);
        
        const dayElement = createAgendaDay(
            day, 
            isToday ? 'today' : '', 
            dayAppointments.length > 0,
            status,
            dayAppointments
        );
        calendarGrid.appendChild(dayElement);
    }
    
    // Add next month days to fill grid
    const totalCells = 42; // 6 rows * 7 days
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createAgendaDay(day, 'other-month', false, null, null);
        calendarGrid.appendChild(dayElement);
    }
}

function createAgendaDay(day, className, hasEvent, status, appointments) {
    const dayElement = document.createElement('div');
    
    // Build class list
    let classes = ['agenda-day'];
    if (className) classes.push(className);
    if (hasEvent) classes.push('has-event');
    if (status === 'available') classes.push('day-available');
    if (status === 'occupied') classes.push('day-occupied');
    if (status === 'unavailable') classes.push('day-unavailable');
    
    dayElement.className = classes.join(' ');
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'agenda-day-number';
    dayNumber.textContent = day;
    dayElement.appendChild(dayNumber);
    
    // Add appointment count badge if occupied
    if (status === 'occupied' && appointments && appointments.length > 0) {
        const badge = document.createElement('div');
        badge.className = 'appointment-badge';
        badge.textContent = appointments.length;
        dayElement.appendChild(badge);
    }
    
    // Add availability indicator
    if (status === 'available') {
        const indicator = document.createElement('div');
        indicator.className = 'availability-indicator';
        indicator.title = 'Día disponible';
        dayElement.appendChild(indicator);
    }
    
    // Add click handler to open WhatsApp for booking
    dayElement.addEventListener('click', () => {
        if (!className.includes('other-month')) {
            const date = new Date(currentAgendaMonth.getFullYear(), currentAgendaMonth.getMonth(), day);
            const dateStr = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
            
            // Check if day is available or occupied
            if (status === 'available') {
                const whatsappLink = `https://wa.me/56944328662?text=Hola!%20Quiero%20agendar%20una%20consulta%20para%20el%20${encodeURIComponent(dateStr)}`;
                window.open(whatsappLink, '_blank');
            } else if (status === 'occupied') {
                // Show appointments for occupied days
                const appointmentList = appointments.map(apt => 
                    `${apt.time} - ${apt.client_name}`
                ).join('\n');
                alert(`Appointments for ${dateStr}:\n\n${appointmentList}`);
            } else {
                // Unavailable day
                const whatsappLink = `https://wa.me/56944328662?text=Hola!%20Quiero%20consultar%20disponibilidad%20para%20el%20${encodeURIComponent(dateStr)}`;
                window.open(whatsappLink, '_blank');
            }
        }
    });
    
    return dayElement;
}

// Initialize agenda calendar when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAgendaCalendar);
} else {
    initAgendaCalendar();
}

// =========================
// INITIALIZE
// =========================
console.log('✅ PVB Estudio Creativo website initialized');
console.log('🎯 All interactive features loaded');

