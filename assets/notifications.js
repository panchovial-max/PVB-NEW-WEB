// PVB Notifications — módulo reutilizable
// Incluir en cualquier página: <script src="/assets/notifications.js"></script>
// Requiere que supabase ya esté inicializado como window._supabase

(function () {
    const SUPABASE_URL = 'https://krmoihryyvooymvhsuno.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtybW9paHJ5eXZvb3ltdmhzdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzMjcxNjAsImV4cCI6MjA1NjkwMzE2MH0.Yr9RHcFqBpONfGRrIxiFRqnfhIEkFmkJQGJX7WmV4Ik';

    const TYPE_ICONS = {
        payment_created: '💰', payment_confirmed: '✅', payment_rejected: '⚠️',
        stage_started: '▶', stage_completed: '✓', stage_blocked: '⚠️',
        moodboard_comment: '💬', moodboard_approved: '✓',
        feed_item: '📌', proof_uploaded: '📎', milestone_completed: '✓'
    };

    const styles = `
        #pvb-notif-btn {
            position: relative; background: none; border: 1px solid #2a2a2a;
            color: #666; cursor: pointer; padding: 6px 10px; font-size: 16px;
            transition: all .15s; line-height: 1;
        }
        #pvb-notif-btn:hover { border-color: #444; color: #fff; }
        #pvb-notif-badge {
            position: absolute; top: -6px; right: -6px;
            background: #e55; color: #fff; font-size: 10px; font-weight: 700;
            width: 18px; height: 18px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-family: 'Inter', sans-serif;
        }
        #pvb-notif-panel {
            position: fixed; top: 56px; right: 0; width: 360px; max-height: calc(100vh - 56px);
            background: #111; border-left: 1px solid #1f1f1f; border-bottom: 1px solid #1f1f1f;
            overflow-y: auto; z-index: 999; transform: translateX(100%);
            transition: transform .2s; box-shadow: -4px 0 20px rgba(0,0,0,.5);
            font-family: 'Inter', sans-serif;
        }
        #pvb-notif-panel.open { transform: translateX(0); }
        .pvb-notif-header {
            padding: 16px 20px; border-bottom: 1px solid #1f1f1f;
            display: flex; align-items: center; justify-content: space-between;
        }
        .pvb-notif-header h3 { font-size: 13px; font-weight: 600; color: #fff; }
        .pvb-notif-mark-all {
            font-size: 11px; color: #666; background: none; border: none;
            cursor: pointer; font-family: 'Inter', sans-serif; padding: 0;
        }
        .pvb-notif-mark-all:hover { color: #fff; }
        .pvb-notif-item {
            padding: 14px 20px; border-bottom: 1px solid #1a1a1a;
            cursor: pointer; transition: background .15s; display: flex; gap: 12px;
        }
        .pvb-notif-item:hover { background: #181818; }
        .pvb-notif-item.unread { background: #0d0f1f; border-left: 2px solid #6a8fff; }
        .pvb-notif-item.unread:hover { background: #111827; }
        .pvb-notif-icon { font-size: 18px; flex-shrink: 0; width: 28px; text-align: center; margin-top: 2px; }
        .pvb-notif-body { flex: 1; min-width: 0; }
        .pvb-notif-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 3px; line-height: 1.4; }
        .pvb-notif-item.unread .pvb-notif-title { color: #fff; }
        .pvb-notif-item:not(.unread) .pvb-notif-title { color: #888; }
        .pvb-notif-text { font-size: 12px; color: #666; line-height: 1.5; margin-bottom: 4px; }
        .pvb-notif-time { font-size: 10px; color: #444; letter-spacing: 0.5px; }
        .pvb-notif-empty { padding: 40px 20px; text-align: center; color: #444; font-size: 13px; }
        .pvb-notif-footer { padding: 12px 20px; border-top: 1px solid #1f1f1f; text-align: center; }
        .pvb-notif-footer a { font-size: 11px; color: #666; text-decoration: none; letter-spacing: 1px; text-transform: uppercase; }
        .pvb-notif-footer a:hover { color: #fff; }
    `;

    let sb = null;
    let currentUser = null;
    let notifications = [];
    let panelOpen = false;

    function timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const m = Math.floor(diff / 60000);
        const h = Math.floor(diff / 3600000);
        const d = Math.floor(diff / 86400000);
        if (m < 1) return 'ahora';
        if (m < 60) return `hace ${m}m`;
        if (h < 24) return `hace ${h}h`;
        return `hace ${d}d`;
    }

    function renderPanel() {
        const unread = notifications.filter(n => !n.read);
        const panel = document.getElementById('pvb-notif-panel');
        const badge = document.getElementById('pvb-notif-badge');

        if (badge) {
            badge.textContent = unread.length;
            badge.style.display = unread.length > 0 ? 'flex' : 'none';
        }

        if (!panel) return;

        panel.innerHTML = `
            <div class="pvb-notif-header">
                <h3>Notificaciones ${unread.length > 0 ? `(${unread.length})` : ''}</h3>
                ${unread.length > 0 ? `<button class="pvb-notif-mark-all" onclick="window.PVBNotif.markAll()">Marcar todo leído</button>` : ''}
            </div>
            ${notifications.length === 0
                ? `<div class="pvb-notif-empty">Sin notificaciones todavía</div>`
                : notifications.slice(0, 20).map(n => `
                    <div class="pvb-notif-item ${!n.read ? 'unread' : ''}"
                        onclick="window.PVBNotif.open('${n.id}','${n.link || ''}')">
                        <div class="pvb-notif-icon">${TYPE_ICONS[n.type] || '🔔'}</div>
                        <div class="pvb-notif-body">
                            <div class="pvb-notif-title">${n.title}</div>
                            ${n.body ? `<div class="pvb-notif-text">${n.body}</div>` : ''}
                            <div class="pvb-notif-time">${timeAgo(n.created_at)}</div>
                        </div>
                    </div>`).join('')}
            <div class="pvb-notif-footer"><a href="/notifications">Ver todas</a></div>`;
    }

    async function load() {
        if (!sb || !currentUser) return;
        const { data } = await sb
            .from('notifications')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(30);
        notifications = data || [];
        renderPanel();
    }

    async function init(supabaseInstance) {
        sb = supabaseInstance;
        const { data: { session } } = await sb.auth.getSession();
        if (!session) return;
        currentUser = session.user;

        // Inject styles
        const style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);

        // Inject button into existing header-right or topbar-right
        const container = document.querySelector('.header-right, .topbar-right, .dash-user');
        if (container) {
            const btn = document.createElement('button');
            btn.id = 'pvb-notif-btn';
            btn.type = 'button';
            btn.innerHTML = `🔔<span id="pvb-notif-badge" style="display:none;">0</span>`;
            btn.onclick = () => toggle();
            container.prepend(btn);
        }

        // Inject panel
        const panel = document.createElement('div');
        panel.id = 'pvb-notif-panel';
        document.body.appendChild(panel);

        // Close on outside click
        document.addEventListener('click', e => {
            if (panelOpen && !document.getElementById('pvb-notif-panel').contains(e.target)
                && e.target.id !== 'pvb-notif-btn') {
                close();
            }
        });

        await load();

        // Realtime
        sb.channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'notifications',
                filter: `user_id=eq.${currentUser.id}`
            }, () => load())
            .subscribe();
    }

    function toggle() { panelOpen ? close() : open(); }
    function open() { panelOpen = true; document.getElementById('pvb-notif-panel')?.classList.add('open'); }
    function close() { panelOpen = false; document.getElementById('pvb-notif-panel')?.classList.remove('open'); }

    async function openNotif(id, link) {
        if (id) await sb.from('notifications').update({ read: true }).eq('id', id);
        close();
        if (link) window.location.href = link;
        await load();
    }

    async function markAll() {
        const ids = notifications.filter(n => !n.read).map(n => n.id);
        if (ids.length > 0) await sb.from('notifications').update({ read: true }).in('id', ids);
        await load();
    }

    // Public API
    window.PVBNotif = { init, load, open: openNotif, markAll, close };
})();
