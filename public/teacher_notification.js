// teacher_notification.js - Create and manage announcements & notices

document.addEventListener("DOMContentLoaded", () => {
    loadTeacherClassesForAnnouncements();
    loadTeacherAnnouncements();
});

async function loadTeacherClassesForAnnouncements() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/view-classes`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const classes = data.classes || [];

        const select = document.getElementById("announcementSubjectSelect");
        if (select) {
            let options = `<option value="">All My Classes & Students</option>`;
            classes.forEach(c => {
                options += `<option value="${c.subject_id}">${escapeHtml(c.subject_name)} (${escapeHtml(c.grade_name || c.subject_id)})</option>`;
            });
            select.innerHTML = options;
        }
    } catch (err) {
        console.error("Error loading classes for announcements:", err);
    }
}

async function handleCreateAnnouncement(e) {
    e.preventDefault();
    const title = document.getElementById("announcementTitle").value.trim();
    const message = document.getElementById("announcementMessage").value.trim();
    const subjectId = document.getElementById("announcementSubjectSelect").value || null;

    if (!title || !message) {
        alert("Please enter title and announcement content.");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/create-announcement`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                title,
                message,
                subject_id: subjectId
            })
        });

        const data = await res.json();
        alert(data.message || "Announcement published successfully!");
        if (data.success) {
            document.getElementById("announcementTitle").value = "";
            document.getElementById("announcementMessage").value = "";
            loadTeacherAnnouncements();
        }
    } catch (err) {
        console.error("Error creating announcement:", err);
        alert("Failed to publish announcement.");
    }
}

async function loadTeacherAnnouncements() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const container = document.getElementById("announcementsFeedContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/api/teacher-announcements`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const announcements = data.announcements || [];

        if (announcements.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #94a3b8; background: rgba(255,255,255,0.04); border-radius: 12px;">
                    <i class="fa fa-bell-slash" style="font-size: 36px; margin-bottom: 10px; color: #cbd5e1;"></i>
                    <p style="margin: 0;">You haven't posted any notices yet.</p>
                </div>
            `;
            return;
        }

        let html = `<div style="display: flex; flex-direction: column; gap: 15px;">`;

        announcements.forEach(a => {
            const dateStr = new Date(a.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            const targetBadge = a.subject_name 
                ? `<span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px;">${escapeHtml(a.subject_name)}</span>`
                : `<span style="background: rgba(34, 197, 94, 0.2); color: #22c55e; font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 12px;">All Students</span>`;

            html += `
                <div style="background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 18px; color: #fff;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                        <h3 style="margin: 0; font-size: 16px; color: #f8fafc;">${escapeHtml(a.title)}</h3>
                        ${targetBadge}
                    </div>
                    <p style="color: #cbd5e1; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${escapeHtml(a.message)}</p>
                    <div style="font-size: 12px; color: #94a3b8;">
                        <i class="fa fa-clock"></i> Posted on ${dateStr}
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("Error loading teacher announcements:", err);
        container.innerHTML = `<p style="color:#ef4444; padding: 20px;">Failed to load announcements feed.</p>`;
    }
}

function escapeHtml(str) {
    if (!str) return "";
    return str.replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}
