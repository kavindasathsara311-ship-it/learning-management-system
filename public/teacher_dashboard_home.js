// teacher_dashboard_home.js - Live Teacher Dashboard Metrics & Widgets

document.addEventListener("DOMContentLoaded", () => {
    initTeacherDashboard();
});

async function initTeacherDashboard() {
    const payload = getTokenPayload();
    if (!payload || (payload.role !== "teacher" && payload.role !== "admin")) {
        window.location.href = "LoginPage.html";
        return;
    }

    // Set greeting and teacher name
    const greetingEl = document.getElementById("teacherGreeting");
    const nameEl = document.getElementById("teacherName");
    const iconEl = document.getElementById("timeIcon");

    const hours = new Date().getHours();
    let greetingText = "Good Morning";
    let iconClass = "fa-sun";

    if (hours >= 12 && hours < 17) {
        greetingText = "Good Afternoon";
        iconClass = "fa-cloud-sun";
    } else if (hours >= 17 || hours < 5) {
        greetingText = "Good Evening";
        iconClass = "fa-moon";
    }

    if (greetingEl) greetingEl.textContent = greetingText;
    if (nameEl) nameEl.textContent = payload.name || payload.id || "Teacher";
    if (iconEl) iconEl.className = `fa-solid ${iconClass}`;

    // Load live KPI counts and widgets in parallel
    loadTeacherMetrics();
}

async function loadTeacherMetrics() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        // 1. Classes count
        const classesPromise = fetch(`${API_BASE}/api/view-classes`, {
            headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ classes: [] }));

        // 2. Exams count
        const examsPromise = fetch(`${API_BASE}/api/teacher-exams`, {
            headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ exams: [] }));

        // 3. Timetable today
        const timetablePromise = fetch(`${API_BASE}/api/teacher-timetable`, {
            headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ timetable: [] }));

        // 4. Assignments to review
        const assignmentsPromise = fetch(`${API_BASE}/api/teacher-assignments`, {
            headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ assignments: [] }));

        // 5. Announcements feed
        const announcementsPromise = fetch(`${API_BASE}/api/teacher-announcements`, {
            headers: { "Authorization": `Bearer ${token}` }
        }).then(r => r.json()).catch(() => ({ announcements: [] }));

        const [classesData, examsData, timetableData, assignmentsData, announcementsData] = await Promise.all([
            classesPromise,
            examsPromise,
            timetablePromise,
            assignmentsPromise,
            announcementsPromise
        ]);

        // 1. Update Classes Card
        const classesCount = (classesData.classes || []).length;
        const classesCardText = document.getElementById("classesCountText");
        if (classesCardText) classesCardText.textContent = `${classesCount} Classes Assigned`;

        // 2. Update Exams Card
        const examsCount = (examsData.exams || []).length;
        const examsCardText = document.getElementById("examsCountText");
        if (examsCardText) examsCardText.textContent = `${examsCount} Upcoming Exams to Monitor`;

        // 3. Update Timetable Card (Today's classes)
        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDay = days[new Date().getDay()];
        const timetableToday = (timetableData.timetable || []).filter(item => {
            const w = (item.weekDay || item.weekday || "").trim().toLowerCase();
            return w === todayDay.toLowerCase();
        });
        const timetableCardText = document.getElementById("timetableCountText");
        if (timetableCardText) {
            timetableCardText.textContent = `${timetableToday.length} Classes Scheduled Today (${todayDay})`;
        }

        // 4. Update Assignments to Review Widget
        const assignments = assignmentsData.assignments || [];
        const totalUngraded = assignments.reduce((acc, curr) => acc + (curr.ungraded_count || 0), 0);
        const totalSubmissions = assignments.reduce((acc, curr) => acc + (curr.submission_count || 0), 0);

        const assignmentsWidget = document.getElementById("upcomingAssignmentWidget");
        if (assignmentsWidget) {
            if (assignments.length === 0) {
                assignmentsWidget.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; color: #fff; font-size: 16px;"><i class="fa fa-tasks" style="color: #00bcd4;"></i> Assignments to Review</h3>
                        <a href="teacher_Assignment.html" style="color: #38bdf8; font-size: 13px; text-decoration: none;">View All &rarr;</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">No active assignments. Create one inside your classes.</p>
                `;
            } else {
                assignmentsWidget.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <div>
                            <h3 style="margin: 0; color: #fff; font-size: 16px;"><i class="fa fa-tasks" style="color: #00bcd4;"></i> Assignments to Review</h3>
                            <span style="font-size: 13px; color: #f59e0b; font-weight: bold;">${totalUngraded} Submissions Pending Review (${totalSubmissions} total)</span>
                        </div>
                        <a href="teacher_Assignment.html" style="background: #00bcd4; color: white; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: bold; text-decoration: none;">
                            Grade Now
                        </a>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${assignments.slice(0, 3).map(a => `
                            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.06); padding: 10px 14px; border-radius: 8px;">
                                <div>
                                    <div style="font-weight: 600; font-size: 14px; color: #fff;">${escapeHtml(a.title)}</div>
                                    <small style="color: #94a3b8;">${escapeHtml(a.subject_name)}</small>
                                </div>
                                <span style="background: ${a.ungraded_count > 0 ? '#f59e0b' : '#22c55e'}; color: ${a.ungraded_count > 0 ? '#000' : '#fff'}; padding: 3px 8px; border-radius: 10px; font-size: 11px; font-weight: bold;">
                                    ${a.ungraded_count > 0 ? `${a.ungraded_count} Ungraded` : 'All Graded'}
                                </span>
                            </div>
                        `).join("")}
                    </div>
                `;
            }
        }

        // 5. Update Announcements Widget
        const announcements = announcementsData.announcements || [];
        const announcementsWidget = document.getElementById("teacherAnnouncementsWidget");
        if (announcementsWidget) {
            if (announcements.length === 0) {
                announcementsWidget.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; color: #fff; font-size: 16px;"><i class="fa fa-bullhorn" style="color: #38bdf8;"></i> Recent Notices</h3>
                        <a href="teacher_Notification.html" style="color: #38bdf8; font-size: 13px; text-decoration: none;">Post Notice &rarr;</a>
                    </div>
                    <p style="color: #94a3b8; font-size: 14px; margin: 0;">No notices posted recently.</p>
                `;
            } else {
                announcementsWidget.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                        <h3 style="margin: 0; color: #fff; font-size: 16px;"><i class="fa fa-bullhorn" style="color: #38bdf8;"></i> Recent Notices</h3>
                        <a href="teacher_Notification.html" style="color: #38bdf8; font-size: 13px; text-decoration: none;">Post New &rarr;</a>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${announcements.slice(0, 3).map(a => `
                            <div style="background: rgba(255,255,255,0.06); padding: 12px 14px; border-radius: 8px;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                    <strong style="color: #f8fafc; font-size: 14px;">${escapeHtml(a.title)}</strong>
                                    <small style="color: #94a3b8;">${new Date(a.created_at).toLocaleDateString()}</small>
                                </div>
                                <p style="color: #cbd5e1; font-size: 13px; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(a.message)}</p>
                            </div>
                        `).join("")}
                    </div>
                `;
            }
        }

    } catch (err) {
        console.error("Error loading teacher metrics:", err);
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
