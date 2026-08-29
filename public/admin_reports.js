// admin_reports.js - Institutional Reports & Analytics Controller

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("reports", "admin");
    loadEnrollmentReport();
});

function switchReportTab(tabName) {
    const tabs = ["enrollment", "attendance", "results", "coursework"];
    const btns = document.querySelectorAll(".reportTabBtn");

    tabs.forEach((t, idx) => {
        const el = document.getElementById(`tab${capitalize(t)}`);
        if (el) el.style.display = (t === tabName) ? "block" : "none";
        if (btns[idx]) {
            if (t === tabName) btns[idx].classList.add("active");
            else btns[idx].classList.remove("active");
        }
    });

    if (tabName === "enrollment") loadEnrollmentReport();
    else if (tabName === "attendance") loadAttendanceReport();
    else if (tabName === "results") loadResultsReport();
    else if (tabName === "coursework") loadCourseworkReport();
}

async function loadEnrollmentReport() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/admin/reports/enrollment", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;

        const gradeTbody = document.getElementById("gradeEnrollmentTbody");
        const totalStudents = data.by_grade.reduce((acc, curr) => acc + parseInt(curr.student_count || 0, 10), 0) || 1;

        if (gradeTbody && data.by_grade) {
            gradeTbody.innerHTML = data.by_grade.map(g => {
                const count = parseInt(g.student_count || 0, 10);
                const percent = ((count / totalStudents) * 100).toFixed(1);
                return `
                    <tr>
                        <td><strong>${escapeHtml(g.grade_id)}</strong></td>
                        <td style="font-weight: 700;">${escapeHtml(g.grade_name)}</td>
                        <td><i class="fa fa-user-graduate" style="color: #38bdf8;"></i> ${count} Students</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div class="progressBar" style="flex: 1;"><div class="progressFill" style="width: ${percent}%; background: #38bdf8;"></div></div>
                                <span style="font-size: 12px; font-weight: bold; width: 45px;">${percent}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        const subTbody = document.getElementById("subjectEnrollmentTbody");
        if (subTbody && data.by_subject) {
            subTbody.innerHTML = data.by_subject.map(s => `
                <tr>
                    <td><strong>${escapeHtml(s.subject_id)}</strong></td>
                    <td style="font-weight: 700;">${escapeHtml(s.subject_name)}</td>
                    <td><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${escapeHtml(s.grade_name || '-')}</span></td>
                    <td><i class="fa fa-users" style="color: #c084fc;"></i> ${s.student_count || 0} Students</td>
                </tr>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading enrollment report:", err);
    }
}

async function loadAttendanceReport() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/admin/reports/attendance", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;

        const overall = data.overall || {};
        document.getElementById("attOverallRate").textContent = (overall.overall_rate || 0) + "%";
        document.getElementById("attPresentCount").textContent = overall.present_count || 0;
        document.getElementById("attAbsentCount").textContent = overall.absent_count || 0;
        document.getElementById("attLateCount").textContent = overall.late_count || 0;

        const gradeTbody = document.getElementById("gradeAttendanceTbody");
        if (gradeTbody && data.by_grade) {
            gradeTbody.innerHTML = data.by_grade.map(g => {
                const rate = g.attendance_rate || 0;
                return `
                    <tr>
                        <td style="font-weight: 700;">${escapeHtml(g.grade_name)}</td>
                        <td>${g.total_records || 0} Total Records</td>
                        <td><i class="fa fa-check" style="color: #4ade80;"></i> ${g.present_count || 0} Present</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div class="progressBar" style="flex: 1;"><div class="progressFill" style="width: ${rate}%; background: ${rate >= 75 ? '#22c55e' : (rate >= 50 ? '#facc15' : '#f87171')};"></div></div>
                                <span style="font-size: 12px; font-weight: bold; width: 50px;">${rate}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }
    } catch (err) {
        console.error("Error loading attendance report:", err);
    }
}

async function loadResultsReport() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/admin/reports/results", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;

        const summary = data.summary || {};
        document.getElementById("resPassRate").textContent = (summary.pass_rate || 0) + "%";
        document.getElementById("resAvgScore").textContent = summary.average_score || 0;
        document.getElementById("resPassCount").textContent = summary.pass_count || 0;
        document.getElementById("resFailCount").textContent = summary.fail_count || 0;

        const tbody = document.getElementById("subjectResultsTbody");
        if (tbody && data.by_subject) {
            if (data.by_subject.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 20px;">No exam marks published yet.</td></tr>`;
                return;
            }
            tbody.innerHTML = data.by_subject.map(s => `
                <tr>
                    <td style="font-weight: 700;">${escapeHtml(s.subject_name)} (${escapeHtml(s.subject_id)})</td>
                    <td><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${escapeHtml(s.grade_name || '-')}</span></td>
                    <td>${s.candidates || 0} Students</td>
                    <td><strong style="color: #38bdf8;">${s.avg_mark || 0}</strong></td>
                    <td>${s.highest_mark || 0} / ${s.lowest_mark || 0}</td>
                    <td><span style="font-weight: bold; color: ${s.pass_rate >= 50 ? '#4ade80' : '#f87171'};">${s.pass_rate || 0}%</span></td>
                </tr>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading results report:", err);
    }
}

async function loadCourseworkReport() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/admin/reports/course-completion", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) return;

        const stats = data.stats || {};
        document.getElementById("cwMaterialsCount").textContent = stats.total_materials || 0;
        document.getElementById("cwAssignmentsCount").textContent = stats.total_assignments || 0;
        document.getElementById("cwSubmissionsCount").textContent = stats.total_submissions || 0;
        document.getElementById("cwGradedCount").textContent = stats.graded_submissions || 0;

        const tbody = document.getElementById("courseworkTbody");
        if (tbody && data.by_subject) {
            tbody.innerHTML = data.by_subject.map(s => `
                <tr>
                    <td style="font-weight: 700;">${escapeHtml(s.subject_name)} (${escapeHtml(s.subject_id)})</td>
                    <td><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 2px 8px; border-radius: 4px; font-size: 11px;">${escapeHtml(s.grade_name || '-')}</span></td>
                    <td><i class="fa fa-file-lines" style="color: #facc15;"></i> ${s.materials_count || 0} files</td>
                    <td><i class="fa fa-tasks" style="color: #38bdf8;"></i> ${s.assignments_count || 0} tasks</td>
                    <td><i class="fa fa-check-circle" style="color: #4ade80;"></i> ${s.submissions_count || 0} submitted</td>
                </tr>
            `).join("");
        }
    } catch (err) {
        console.error("Error loading coursework report:", err);
    }
}

function capitalize(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
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
