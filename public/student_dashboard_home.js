// student_dashboard_home.js - Live data loader for Student Dashboard Home

async function initDashboardHome() {
    const payload = getTokenPayload();
    const token = localStorage.getItem("token");

    if (!token || !payload || payload.role !== "student") {
        window.location.href = "LoginPage.html";
        return;
    }

    // 1. Set personalized greeting & name
    setDynamicGreeting(payload);

    // 2. Fetch all widget data in parallel
    await Promise.allSettled([
        loadEnrolledSubjectsCount(token),
        loadUpcomingExamsCount(token),
        loadAttendanceRate(token),
        loadTodaySchedule(token),
        loadUpcomingAssignments(token),
        loadRecentAnnouncements(token)
    ]);
}

function setDynamicGreeting(payload) {
    const nameSpan = document.getElementById("studentName");
    const greetingHeading = document.getElementById("greeting");
    const timeIcon = document.getElementById("timeIcon");

    const hour = new Date().getHours();
    let greetingText = "Good Morning";
    let iconClass = "fa-sun";

    if (hour >= 12 && hour < 17) {
        greetingText = "Good Afternoon";
        iconClass = "fa-cloud-sun";
    } else if (hour >= 17 || hour < 5) {
        greetingText = "Good Evening";
        iconClass = "fa-moon";
    }

    if (greetingHeading) greetingHeading.textContent = greetingText;
    if (timeIcon) timeIcon.className = `fa-solid ${iconClass}`;
    if (nameSpan) {
        nameSpan.textContent = payload.name || payload.username || "Student";
    }
}

async function loadEnrolledSubjectsCount(token) {
    const countElem = document.getElementById("subjectsCount");
    if (!countElem) return;

    try {
        const res = await fetch(`${API_BASE}/student-subjects`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const subjects = data.enrolled_subjects || [];
        countElem.textContent = subjects.length;
    } catch (err) {
        console.error("Error fetching enrolled subjects count:", err);
        countElem.textContent = "0";
    }
}

async function loadUpcomingExamsCount(token) {
    const countElem = document.getElementById("examsCount");
    if (!countElem) return;

    try {
        const res = await fetch(`${API_BASE}/api/exam-schedule`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const exams = data.exam_schedule || [];
        
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const upcomingExams = exams.filter(e => {
            if (!e.date) return false;
            const examDate = new Date(e.date);
            return examDate >= now;
        });

        countElem.textContent = upcomingExams.length;
    } catch (err) {
        console.error("Error fetching exams count:", err);
        countElem.textContent = "0";
    }
}

async function loadAttendanceRate(token) {
    const rateElem = document.getElementById("attendanceRate");
    if (!rateElem) return;

    try {
        const res = await fetch(`${API_BASE}/api/student-attendance?_t=${Date.now()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.summary) {
            rateElem.textContent = `${data.summary.percentage}%`;
        } else {
            rateElem.textContent = "--%";
        }
    } catch (err) {
        console.error("Error fetching attendance rate:", err);
        rateElem.textContent = "--%";
    }
}

async function loadTodaySchedule(token) {
    const scheduleElem = document.getElementById("todayClassesCount");
    if (!scheduleElem) return;

    try {
        const res = await fetch(`${API_BASE}/api/timeTable`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const timetable = data.time_table || [];

        const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const todayDay = days[new Date().getDay()];

        const todayClasses = timetable.filter(entry => {
            const entryDay = (entry.weekDay || entry.weekday || "").trim().toLowerCase();
            return entryDay === todayDay.toLowerCase();
        });

        scheduleElem.textContent = `${todayClasses.length} Today`;
    } catch (err) {
        console.error("Error fetching timetable:", err);
        scheduleElem.textContent = "0 Today";
    }
}

async function loadUpcomingAssignments(token) {
    const container = document.getElementById("assignmentsContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/api/student-assignments`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const assignments = data.assignments || [];

        const now = new Date();
        const upcoming = assignments
            .filter(a => new Date(a.due_date) >= now)
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
            .slice(0, 4);

        if (upcoming.length === 0) {
            container.innerHTML = `
                <div class="dashEmptyState">
                    <i class="fa fa-clipboard-check"></i>
                    <p>No upcoming assignments due soon.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = upcoming.map(item => {
            const dueDate = new Date(item.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            const isSubmitted = !!item.submission_id;

            return `
                <div class="dashListItem" onclick="window.location.href='student_assignments.html'">
                    <div class="dashItemLeft">
                        <span class="dashItemTitle">${escapeHtml(item.title)}</span>
                        <span class="dashItemSub">${escapeHtml(item.subject_name)} &bull; Due: ${dueDate}</span>
                    </div>
                    <div>
                        <span class="dashBadge ${isSubmitted ? 'badgeSubmitted' : 'badgePending'}">
                            ${isSubmitted ? 'Submitted' : 'Pending'}
                        </span>
                    </div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Error loading upcoming assignments:", err);
        container.innerHTML = `<p style="color:#ef4444; padding: 15px;">Failed to load assignments.</p>`;
    }
}

async function loadRecentAnnouncements(token) {
    const container = document.getElementById("announcementsContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/api/student-announcements`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const announcements = (data.announcements || []).slice(0, 4);

        if (announcements.length === 0) {
            container.innerHTML = `
                <div class="dashEmptyState">
                    <i class="fa fa-bell-slash"></i>
                    <p>No announcements published.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = announcements.map(item => {
            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric"
            }) : "";

            return `
                <div class="dashListItem" onclick="window.location.href='student_notification.html'">
                    <div class="dashItemLeft">
                        <span class="dashItemTitle">${escapeHtml(item.title)}</span>
                        <span class="dashItemSub">${escapeHtml((item.content || '').substring(0, 75))}...</span>
                    </div>
                    <div class="dashItemDate">${dateStr}</div>
                </div>
            `;
        }).join("");

    } catch (err) {
        console.error("Error loading announcements:", err);
        container.innerHTML = `<p style="color:#ef4444; padding: 15px;">Failed to load announcements.</p>`;
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
