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

        // Load Dashboard Attendance Chart
        loadDashAttendanceChart(token);

    } catch (err) {
        console.error("Error loading admin dashboard summary:", err);
    }
}

let dashAttendanceChartInstance = null;

async function loadDashAttendanceChart(token) {
    const canvas = document.getElementById("dashAttendanceChart");
    if (!canvas || typeof Chart === "undefined") return;

    try {
        const res = await fetch("/api/admin/reports/attendance", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;

        const trends = data.daily_trends || [];
        let labels = [];
        let present = [];
        let absent = [];

        if (trends.length > 0) {
            labels = trends.slice(-7).map(d => formatDate(d.date));
            present = trends.slice(-7).map(d => parseInt(d.present || 0, 10));
            absent = trends.slice(-7).map(d => parseInt(d.absent || 0, 10));
        } else {
            labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
            present = [10, 12, 11, 14, 13];
            absent = [1, 2, 0, 1, 0];
        }

        if (dashAttendanceChartInstance) dashAttendanceChartInstance.destroy();

        dashAttendanceChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Present',
                        data: present,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4
                    },
                    {
                        label: 'Absent',
                        data: absent,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#cbd5e1', font: { size: 11 }, usePointStyle: true }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: '#94a3b8', precision: 0 }
                    }
                }
            }
        });
    } catch (err) {
        console.error("Error loading dashboard attendance chart:", err);
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
