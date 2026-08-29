// admin_dashboard.js - Admin Dashboard Live Controller

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("dashboard", "admin");
    loadAdminDashboardSummary();
});

async function loadAdminDashboardSummary() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "LoginPage.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/dashboard-summary`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (response.status === 401 || response.status === 403) {
            alert("Access Denied: Please log in as an administrator.");
            localStorage.removeItem("token");
            window.location.href = "LoginPage.html";
            return;
        }

        const data = await response.json();
        if (!data.success || !data.summary) return;

        const summary = data.summary;

        // KPI Counts
        document.getElementById("kpiStudents").textContent = summary.total_students || 0;
        document.getElementById("kpiTeachers").textContent = summary.total_teachers || 0;
        document.getElementById("kpiSubjects").textContent = summary.total_subjects || 0;
        document.getElementById("kpiExams").textContent = summary.upcoming_exams || 0;

        // Recent Students Table
        const recentTbody = document.getElementById("recentStudentsTbody");
        if (recentTbody) {
            if (summary.recent_students && summary.recent_students.length > 0) {
                recentTbody.innerHTML = summary.recent_students.map(s => `
                    <tr>
                        <td><strong>${escapeHtml(s.student_reg_no || String(s.student_id))}</strong></td>
                        <td>${escapeHtml(s.student_name)}</td>
                        <td><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${escapeHtml(s.grade_name || 'Unassigned')}</span></td>
                        <td>${formatDate(s.created_at)}</td>
                    </tr>
                `).join("");
            } else {
                recentTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 15px;">No students registered yet.</td></tr>`;
            }
        }

        // Recent Announcements Feed
        const announceContainer = document.getElementById("recentAnnouncementsList");
        if (announceContainer) {
            if (summary.recent_announcements && summary.recent_announcements.length > 0) {
                announceContainer.innerHTML = summary.recent_announcements.map(a => `
                    <div class="noticeItem">
                        <div class="noticeTitle">${escapeHtml(a.title)}</div>
                        <div style="font-size: 13px; color: #cbd5e1; margin-bottom: 6px;">${escapeHtml(a.message)}</div>
                        <div class="noticeMeta"><i class="fa fa-user"></i> ${escapeHtml(a.author)} &bull; ${formatDate(a.created_at)}</div>
                    </div>
                `).join("");
            } else {
                announceContainer.innerHTML = `<p style="color: #94a3b8; font-size: 13px;">No announcements published yet.</p>`;
            }
        }

    } catch (err) {
        console.error("Error loading admin dashboard summary:", err);
    }
}

function formatDate(isoStr) {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[m]));
}
