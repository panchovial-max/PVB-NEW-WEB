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

// Fechas comerciales y feriados de Chile 2026 — calendario de marketing
const CHILE_MARKETING_EVENTS = [
    // ── FERIADOS NACIONALES ──────────────────────────────────────────────────
    { event_id: 'cl-ano-nuevo',        event_title: '🎆 Año Nuevo',                  event_description: 'Feriado nacional. Campaña de resoluciones, viajes y metas 2026. Alto tráfico e-commerce.', event_date: '2026-01-01', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-semana-santa-v',   event_title: '✝️ Viernes Santo',              event_description: 'Feriado legal. Bajo tráfico laboral — ideal para campañas de reflexión, turismo y familia.', event_date: '2026-04-03', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-semana-santa-s',   event_title: '✝️ Sábado Santo',               event_description: 'Cierre Semana Santa. Viajes de regreso, últimas horas de campañas pascueras.', event_date: '2026-04-04', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-trabajo',          event_title: '⚒️ Día del Trabajo',             event_description: 'Feriado 1 de mayo. Campañas de bienestar laboral, RRHH, beneficios de empresa.', event_date: '2026-05-01', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-glorias',          event_title: '⚓ Glorias Navales (21 mayo)',   event_description: 'Feriado nacional. Mensaje patriótico, campañas cívicas y de orgullo chileno.', event_date: '2026-05-21', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-san-pedro',        event_title: '⚓ San Pedro y San Pablo',       event_description: 'Feriado 29 junio. Fin de semana largo — turismo, gastronomía y entretenimiento.', event_date: '2026-06-29', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-virgen-carmen',    event_title: '🕊️ Virgen del Carmen',          event_description: 'Feriado 16 julio. Campañas de fe, familia y cultura popular chilena.', event_date: '2026-07-16', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-asuncion',        event_title: '🕊️ Asunción de la Virgen',      event_description: 'Feriado 15 agosto. Fin de semana largo — segunda temporada de viajes.', event_date: '2026-08-15', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-independencia',    event_title: '🇨🇱 Independencia Nacional',    event_description: 'Fiestas Patrias — 18 septiembre. El mayor peak publicitario del año en Chile. Comida, cueca, marcas nacionales.', event_date: '2026-09-18', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '🇨🇱 Fiestas Patrias' },
    { event_id: 'cl-ejercitos',        event_title: '🇨🇱 Glorias del Ejército',      event_description: 'Feriado 19 septiembre. Gran fin de semana largo — viajes, turismo interno, gastronomía.', event_date: '2026-09-19', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '🇨🇱 Fiestas Patrias' },
    { event_id: 'cl-encuentro',        event_title: '🌎 Encuentro Dos Mundos',        event_description: 'Feriado 12 octubre. Diversidad cultural, pueblos originarios, turismo patrimonial.', event_date: '2026-10-12', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-reforma',          event_title: '✝️ Día de la Reforma',           event_description: 'Feriado 31 octubre. Fin de semana largo — ideal para retail y entretenimiento.', event_date: '2026-10-31', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-todos-santos',     event_title: '🕯️ Todos los Santos',           event_description: 'Feriado 1 noviembre. Conmemoración, flores, visitas a cementerios.', event_date: '2026-11-01', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-inmaculada',       event_title: '🕊️ Inmaculada Concepción',      event_description: 'Feriado 8 diciembre. Inicio del período navideño — primer gran fin de semana de compras.', event_date: '2026-12-08', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '🇨🇱 Feriado Chile' },
    { event_id: 'cl-navidad',          event_title: '🎄 Navidad',                     event_description: 'Feriado 25 diciembre. Peak máximo de ventas retail del año.', event_date: '2026-12-25', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '🇨🇱 Feriado Chile' },

    // ── FECHAS COMERCIALES CLAVE ─────────────────────────────────────────────
    { event_id: 'cl-dia-madre-prep',   event_title: '💐 Preparar: Día de la Madre',    event_description: '⚠️ Faltan 60 días para el Día de la Madre (10 mayo). Momento ideal para definir concepto, creatividades, pauta y descuentos. El 2do evento de ventas más importante de Chile.', event_date: '2026-03-11', event_time: 'Todo el día', event_type: 'deadline', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-madre',        event_title: '💐 Día de la Madre',             event_description: '2do domingo de mayo — uno de los días de mayor venta en Chile. Flores, joyas, spa, gastronomía, regalos experienciales. Alto ticket promedio.', event_date: '2026-05-10', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-padre-prep',   event_title: '👔 Preparar: Día del Padre',      event_description: '⚠️ Faltan 60 días para el Día del Padre (21 junio). Definir concepto, producción de contenido, pauta digital y ofertas. Tecnología, deporte, gastronomía — ticket promedio alto.', event_date: '2026-04-22', event_time: 'Todo el día', event_type: 'deadline', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-padre',        event_title: '👔 Día del Padre',               event_description: '3er domingo de junio. Uno de los 5 días de mayor venta del año en Chile. Tecnología, auto, deporte, gastronomía.', event_date: '2026-06-21', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-halloween',        event_title: '🎃 Halloween',                   event_description: 'Tendencia creciente en Chile — retail, gastronomía, disfraces y entretenimiento. Ideal para contenido social y activaciones.', event_date: '2026-10-31', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-navidad-prep',     event_title: '🎄 Preparar: Navidad',           event_description: '⚠️ Faltan 60 días para Navidad (25 dic). Producir campañas navideñas, definir descuentos, coordinar pauta. El retail chileno empieza a comunicar desde aquí.', event_date: '2026-10-26', event_time: 'Todo el día', event_type: 'deadline', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-enamorados',   event_title: '💕 Día de los Enamorados',       event_description: '14 de febrero. Flores, joyería, restaurantes, experiencias en pareja. Oportunidad para servicios de lujo y regalos personalizados.', event_date: '2026-02-14', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-nino-prep',    event_title: '🧒 Preparar: Día del Niño',       event_description: '⚠️ Faltan 60 días para el Día del Niño (16 agosto). Tiempo de producción de contenido, coordinación con marcas infantiles y planificación de pauta.', event_date: '2026-06-17', event_time: 'Todo el día', event_type: 'deadline', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-nino',         event_title: '🧒 Día del Niño',                event_description: '3er domingo de agosto. Tercer evento de ventas de temporada alta. Juguetes, tecnología, ropa, calzado infantil.', event_date: '2026-08-16', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-vuelta-clases',    event_title: '🎒 Vuelta a Clases',             event_description: 'Temporada escolar — marzo. Útiles escolares, ropa, calzado, tecnología educativa. Alto volumen de ventas masivas.', event_date: '2026-03-02', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-18s-fiestas-prep', event_title: '🇨🇱 Preparar: Fiestas Patrias',  event_description: '⚠️ Faltan 60 días para el 18 de Septiembre. El mayor peak publicitario del año en Chile. Definir concepto, producción audiovisual, pauta y activaciones. Empanadas, cueca, vestuario típico, ramadas.', event_date: '2026-07-20', event_time: 'Todo el día', event_type: 'deadline', priority: 'high', campaign_name: '🇨🇱 Fiestas Patrias' },
    { event_id: 'cl-dia-profesores',   event_title: '🍎 Día del Profesor',            event_description: '16 de octubre. Útil para marcas de educación, tecnología educativa y retail de regalo.', event_date: '2026-10-16', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-nochebuena',       event_title: '🎄 Nochebuena',                  event_description: '24 diciembre. Cenas, reuniones familiares, última oportunidad de venta navideña. Gastronomía y delivery peak máximo.', event_date: '2026-12-24', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-fin-ano',          event_title: '🎆 Nochevieja',                  event_description: '31 diciembre. Fiestas, viajes, gastronomía, moda. Balances de marca y contenido "año en review".', event_date: '2026-12-31', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },

    // ── CYBERDAYS CHILE ──────────────────────────────────────────────────────
    { event_id: 'cl-cyberday-mayo',    event_title: '💻 CyberDay (inicio)',            event_description: 'CyberDay Chile — evento oficial de la CCS. Lunes de la primera semana de junio aprox. Descuentos masivos online. Prepara creatividad y ofertas con anticipación.', event_date: '2026-06-01', event_time: 'Todo el día', event_type: 'campaign_start', priority: 'high', campaign_name: '🛒 CyberDay Chile' },
    { event_id: 'cl-cybermonday',      event_title: '🛒 CyberMonday Chile',            event_description: 'CyberMonday Chile — octubre. Tercer evento de descuentos digital del año, organizado por la CCS. Preparar landing, creatividades y pauta digital.', event_date: '2026-10-05', event_time: 'Todo el día', event_type: 'campaign_start', priority: 'high', campaign_name: '🛒 CyberDay Chile' },
    { event_id: 'cl-black-friday',     event_title: '🖤 Black Friday',                 event_description: 'Último viernes de noviembre. Creciendo fuerte en Chile — retail, tecnología, moda. Prepara campaña desde la semana anterior.', event_date: '2026-11-27', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '🛒 CyberDay Chile' },
    { event_id: 'cl-cyber-wknd',       event_title: '🖤 Cyber Weekend',               event_description: 'Sábado y domingo post Black Friday. Extensión de descuentos — alto volumen de conversión e-commerce.', event_date: '2026-11-28', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '🛒 CyberDay Chile' },
    { event_id: 'cl-cybermonday-us',   event_title: '💻 Cyber Monday (EEUU)',          event_description: 'Lunes post Black Friday. Muchas marcas chilenas se suman al Cyber Monday internacional — oportunidad de extensión.', event_date: '2026-11-30', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '🛒 CyberDay Chile' },

    // ── TEMPORADAS Y TENDENCIAS ANUALES ──────────────────────────────────────
    { event_id: 'cl-verano',           event_title: '☀️ Inicio Temporada Verano',     event_description: 'Diciembre–febrero. Temporada alta de turismo interno, playas, gastronomía veraniega. Activar campañas de verano y destinos.', event_date: '2026-01-05', event_time: 'Todo el día', event_type: 'campaign_start', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-invierno-prep',    event_title: '❄️ Prep. Campaña Invierno',      event_description: 'Mayo–junio: activar campañas de moda invierno, calefacción, gastronomía reconfortante y turismo de nieve.', event_date: '2026-05-04', event_time: 'Todo el día', event_type: 'campaign_start', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-primavera',        event_title: '🌸 Primavera',                   event_description: 'Septiembre 23 — equinoccio de primavera. Temporada de renovación, moda, colores nuevos, lifestyle. Ideal para lanzamientos.', event_date: '2026-09-23', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-mujer',        event_title: '♀️ Día Internacional de la Mujer', event_description: '8 de marzo. Fecha clave de posicionamiento de marca con valores. Contenido de propósito, diversidad e inclusión.', event_date: '2026-03-08', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-tierra',       event_title: '🌍 Día de la Tierra',            event_description: '22 de abril. Oportunidad para marcas con posicionamiento sustentable y RSE. Contenido de impacto ambiental.', event_date: '2026-04-22', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-orgullo',          event_title: '🏳️‍🌈 Mes del Orgullo',           event_description: 'Junio = Mes del Orgullo LGBTQ+. Posicionamiento de marca inclusiva, campañas de diversidad. Marcha del Orgullo Santiago en junio.', event_date: '2026-06-13', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-amistad',      event_title: '🤝 Día de la Amistad',           event_description: '20 de julio. Fecha creciente en redes sociales — contenido emocional, planes entre amigos, gastronomía.', event_date: '2026-07-20', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-consumidor',   event_title: '🛍️ Día del Consumidor',          event_description: '15 de marzo — Día Mundial del Consumidor. Oportuna para marcas que quieran destacar transparencia, calidad y servicio al cliente.', event_date: '2026-03-15', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-libro',        event_title: '📚 Día del Libro / FILSA',       event_description: '23 de abril — Día del Libro. Octubre–noviembre: Feria Internacional del Libro de Santiago (FILSA). Contenido educativo y cultural.', event_date: '2026-04-23', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-jazz',         event_title: '🎵 Santiago Jazz Festival',      event_description: 'Noviembre — referente cultural de Santiago. Oportunidad para marcas de lifestyle, gastronomía y entretenimiento.', event_date: '2026-11-06', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },

    // ── FECHAS ESPECIALES Y NICHOS (fuente: marketing4ecommerce.cl) ─────────
    { event_id: 'cl-reyes',             event_title: '👑 Día de Reyes',                event_description: '6 de enero. Campañas de regalos infantiles, juguetes y experiencias. Fecha clave para marcas familiares.', event_date: '2026-01-06', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-carnaval-arica',    event_title: '🎉 Carnaval de Arica',           event_description: '30 ene – 1 feb. El carnaval más grande de Chile. Turismo, moda colorida, gastronomía norteña y activaciones de marca en terreno.', event_date: '2026-01-30', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-superbowl',         event_title: '🏈 Super Bowl',                  event_description: '8 de febrero. Alto engagement en redes — campañas de snacks, cervezas, streaming y entretenimiento. Ideal para brands con audiencia masculina 18-35.', event_date: '2026-02-08', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-soltero',       event_title: '💔 Día del Soltero',             event_description: '13 de febrero. Contraprogramación al Día del Enamorado — humor, autoregalo, entretenimiento. Creciendo en redes sociales.', event_date: '2026-02-13', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-oscars',            event_title: '🏆 Premios Óscar',               event_description: '15 de marzo aprox. Alto engagement en redes — entretenimiento, moda, streaming. Ideal para marcas de lifestyle y cultura.', event_date: '2026-03-15', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-san-patricio',      event_title: '☘️ Día de San Patricio',         event_description: '17 de marzo. Creciente en Chile — bares, cerveza artesanal, gastronomía irlandesa. Excelente para campañas de entretenimiento nocturno.', event_date: '2026-03-17', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-coleccion-oi',      event_title: '🧥 Lanzamiento Colección O/I',   event_description: 'Semana del 14–20 de marzo. Activación de temporada otoño-invierno — moda, calzado, accesorios.', event_date: '2026-03-16', event_time: 'Todo el día', event_type: 'campaign_start', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-pascuas',           event_title: '🐣 Pascuas',                     event_description: '5 de abril. Chocolates, huevos de pascua, celebración familiar. Ideal para confites, gastronomía y marcas infantiles.', event_date: '2026-04-05', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-familias',          event_title: '👨‍👩‍👧 Día de las Familias',          event_description: '15 de mayo. Contenido emocional, campañas de propósito y experiencias en familia. Complementa al Día de la Madre.', event_date: '2026-05-15', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-completo',      event_title: '🌭 Día del Completo',            event_description: '24 de mayo. Fecha viral en redes — gastronomía chilena, fast food, delivery. Alto engagement orgánico.', event_date: '2026-05-24', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-redes-sociales',    event_title: '📱 Día Mundial de las RRSS',     event_description: '30 de junio. Fecha ideal para que marcas celebren su comunidad digital y lancen campañas de engagement.', event_date: '2026-06-30', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-ventas-invierno',   event_title: '❄️ Ventas de Invierno',          event_description: '15–19 de julio. Temporada de liquidación de invierno — moda, calzado, hogar. Alto volumen de tráfico en retail.', event_date: '2026-07-15', event_time: 'Todo el día', event_type: 'campaign_start', priority: 'high', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-perro',         event_title: '🐶 Día Mundial del Perro',       event_description: '21 de julio. Contenido viral — mascotas, petfood, accesorios para perros. Alto engagement orgánico en redes.', event_date: '2026-07-21', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-gato',          event_title: '🐱 Día Mundial del Gato',        event_description: '8 de agosto. Campañas virales de mascotas, petfood, accesorios. Una de las fechas de mayor engagement orgánico del año.', event_date: '2026-08-08', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-hashtag',           event_title: '#️⃣ Día del Internauta',          event_description: '23 de agosto. Ideal para marcas digitales, agencias y tecnología. Celebrar comunidades online.', event_date: '2026-08-23', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-gamer',         event_title: '🎮 Día del Gamer',               event_description: '29 de agosto. Tecnología, gaming, streaming, snacks. Audiencia joven 15-30 años — alto engagement orgánico.', event_date: '2026-08-29', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-dia-belleza',       event_title: '💄 Día de la Belleza',           event_description: '9 de septiembre. Cosméticos, cuidado personal, salud y bienestar. Peak para marcas de belleza y farmacias.', event_date: '2026-09-09', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-coleccion-pv',      event_title: '🌸 Lanzamiento Colección P/V',   event_description: '21 de septiembre. Inicio de temporada primavera-verano — moda, outdoor, turismo. Activar lookbooks y creatividades de temporada.', event_date: '2026-09-21', event_time: 'Todo el día', event_type: 'campaign_start', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-turismo',           event_title: '✈️ Día Mundial del Turismo',     event_description: '27 de septiembre. Agencias de viaje, hoteles, aerolíneas y destinos. Contenido aspiracional y campañas de escapadas.', event_date: '2026-09-27', event_time: 'Todo el día', event_type: 'milestone', priority: 'normal', campaign_name: '📅 Marketing Chile' },
    { event_id: 'cl-animales',          event_title: '🐾 Día Mundial de los Animales', event_description: '4 de octubre. Mascotas, bienestar animal, petfood, veterinarias. RSE y contenido emocional de alto alcance.', event_date: '2026-10-04', event_time: 'Todo el día', event_type: 'milestone', priority: 'low', campaign_name: '📅 Marketing Chile' },

    // ── PUBLICIDAD Y MEDIOS ──────────────────────────────────────────────────
    { event_id: 'cl-achap',            event_title: '📢 Festival ACHAP',              event_description: 'Festival de Creatividad Publicitaria de Chile — organizado por la Asociación Chilena de Agencias de Publicidad. Referente de la industria local.', event_date: '2026-08-20', event_time: 'Todo el día', event_type: 'milestone', priority: 'high', campaign_name: '🎬 Industria Chile' },
    { event_id: 'cl-seminario-iab',    event_title: '💡 Seminario IAB Chile',         event_description: 'Interactive Advertising Bureau Chile — tendencias en marketing digital, programmatic, data y nuevos formatos.', event_date: '2026-09-10', event_time: 'Todo el día', event_type: 'meeting', priority: 'normal', campaign_name: '🎬 Industria Chile' },
    { event_id: 'cl-expomarketing',    event_title: '📊 ExpoMarketing Chile',         event_description: 'Feria y congreso de marketing más grande de Chile — proveedores, tendencias, casos de éxito.', event_date: '2026-10-08', event_time: 'Todo el día', event_type: 'meeting', priority: 'normal', campaign_name: '🎬 Industria Chile' },
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

    // Add day headers (week starts Monday)
    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendarGrid.appendChild(header);
    });

    // Adjust firstDay for Monday start (0=Mon, 6=Sun)
    const firstDayMon = (firstDay + 6) % 7;

    // Add previous month days
    for (let i = firstDayMon - 1; i >= 0; i--) {
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
            // Priority dot indicator under day number
            const hasHigh = dayEvents.some(e => e.priority === 'high');
            const hasNormal = dayEvents.some(e => e.priority === 'normal' || e.event_type === 'deadline');
            const dotsBar = document.createElement('div');
            dotsBar.className = 'calendar-day-dots';
            dayEvents.slice(0, 4).forEach(e => {
                const dot = document.createElement('span');
                dot.className = `calendar-dot ${e.priority === 'high' ? 'dot-high' : e.priority === 'normal' || e.event_type === 'deadline' ? 'dot-normal' : 'dot-low'}`;
                dotsBar.appendChild(dot);
            });
            dayElement.appendChild(dotsBar);
            if (hasHigh) dayElement.classList.add('has-high-event');
            else if (hasNormal) dayElement.classList.add('has-normal-event');

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
    const remainingCells = 42 - (firstDayMon + daysInMonth);
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
        calendarEvents = [...FESTIVAL_EVENTS, ...CHILE_MARKETING_EVENTS];
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
            calendarEvents = [...FESTIVAL_EVENTS, ...CHILE_MARKETING_EVENTS];
            renderCalendar();
            renderUpcomingEvents();
            showCalendarConnectPrompt();
            return;
        }

        calendarConnected = true;
        hideCalendarConnectPrompt();

        if (data.events) {
            // Merge Google Calendar events with festivals
            calendarEvents = [...data.events, ...FESTIVAL_EVENTS, ...CHILE_MARKETING_EVENTS];
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
        'deadline': '⚠️ Preparar Campaña',
        'milestone': 'Fecha Clave'
    };
    return types[type] || type;
}

// Render upcoming events
function renderUpcomingEvents() {
    const container = document.getElementById('upcomingEventsList');
    if (!container) return;

    // Get upcoming events (next 90 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureLimit = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);

    const upcoming = calendarEvents
        .filter(e => {
            const eventDate = new Date(e.event_date + 'T00:00:00');
            return eventDate >= today && eventDate <= futureLimit;
        })
        .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
        .slice(0, 6);

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
