// admin_reports.js - Institutional Reports, Analytics & Graphs Controller

let lineChartInstance = null;
let doughnutChartInstance = null;
let gradeBarChartInstance = null;
let enrollmentChartInstance = null;

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

            renderEnrollmentChart(data.by_grade);
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

function renderEnrollmentChart(byGrade) {
    const canvas = document.getElementById("enrollmentBarChart");
    if (!canvas || typeof Chart === "undefined") return;

    const labels = byGrade.map(g => g.grade_name || g.grade_id);
    const counts = byGrade.map(g => parseInt(g.student_count || 0, 10));

    if (enrollmentChartInstance) enrollmentChartInstance.destroy();

    enrollmentChartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Enrolled Students',
                data: counts,
                backgroundColor: 'rgba(56, 189, 248, 0.75)',
                borderColor: '#38bdf8',
                borderWidth: 1.5,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#ffffff',
                    bodyColor: '#cbd5e1',
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

        // Render Attendance Graphs
        renderAttendanceGraphs(overall, data.by_grade || [], data.daily_trends || []);

    } catch (err) {
        console.error("Error loading attendance report:", err);
    }
}

function renderAttendanceGraphs(overall, byGrade, dailyTrends) {
    if (typeof Chart === "undefined") return;

    // 1. Line Chart: Daily Attendance Timeline
    const lineCanvas = document.getElementById("dailyAttendanceLineChart");
    if (lineCanvas) {
        let labels = [];
        let presentData = [];
        let absentData = [];
        let lateData = [];

        if (dailyTrends && dailyTrends.length > 0) {
            labels = dailyTrends.map(d => formatDate(d.date));
            presentData = dailyTrends.map(d => parseInt(d.present || 0, 10));
            absentData = dailyTrends.map(d => parseInt(d.absent || 0, 10));
            lateData = dailyTrends.map(d => parseInt(d.late || 0, 10));
        } else {
            labels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
            presentData = [overall.present_count || 0, overall.present_count || 0, overall.present_count || 0, overall.present_count || 0, overall.present_count || 0];
            absentData = [overall.absent_count || 0, overall.absent_count || 0, overall.absent_count || 0, overall.absent_count || 0, overall.absent_count || 0];
            lateData = [overall.late_count || 0, overall.late_count || 0, overall.late_count || 0, overall.late_count || 0, overall.late_count || 0];
        }

        if (lineChartInstance) lineChartInstance.destroy();

        lineChartInstance = new Chart(lineCanvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Present',
                        data: presentData,
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Absent',
                        data: absentData,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Late',
                        data: lateData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        fill: true,
                        tension: 0.35,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: '#cbd5e1', font: { size: 12, weight: 'bold' }, usePointStyle: true }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1,
                        padding: 10
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
    }

    // 2. Doughnut Chart: Overall Status Ratio
    const pieCanvas = document.getElementById("attendanceDoughnutChart");
    if (pieCanvas) {
        const present = parseInt(overall.present_count || 0, 10);
        const absent = parseInt(overall.absent_count || 0, 10);
        const late = parseInt(overall.late_count || 0, 10);

        if (doughnutChartInstance) doughnutChartInstance.destroy();

        doughnutChartInstance = new Chart(pieCanvas, {
            type: 'doughnut',
            data: {
                labels: ['Present', 'Absent', 'Late'],
                datasets: [{
                    data: [present, absent, late],
                    backgroundColor: ['#22c55e', '#ef4444', '#f59e0b'],
                    borderColor: '#1e293b',
                    borderWidth: 2,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#cbd5e1', font: { size: 12 }, usePointStyle: true }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1
                    }
                },
                cutout: '65%'
            }
        });
    }

    // 3. Bar Chart: Grade-Wise Attendance Rate Comparison
    const gradeCanvas = document.getElementById("gradeAttendanceBarChart");
    if (gradeCanvas) {
        const labels = byGrade.map(g => g.grade_name || g.grade_id);
        const rates = byGrade.map(g => parseFloat(g.attendance_rate || 0));

        if (gradeBarChartInstance) gradeBarChartInstance.destroy();

        gradeBarChartInstance = new Chart(gradeCanvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: rates,
                    backgroundColor: rates.map(r => r >= 75 ? 'rgba(34, 197, 94, 0.8)' : (r >= 50 ? 'rgba(250, 204, 21, 0.8)' : 'rgba(248, 113, 113, 0.8)')),
                    borderColor: rates.map(r => r >= 75 ? '#22c55e' : (r >= 50 ? '#facc15' : '#f87171')),
                    borderWidth: 1.5,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        borderColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1,
                        callbacks: {
                            label: function(ctx) { return ` Attendance: ${ctx.parsed.y}%`; }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: { color: '#94a3b8' }
                    },
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: {
                            color: '#94a3b8',
                            callback: function(v) { return v + '%'; }
                        }
                    }
                }
            }
        });
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

function formatDate(isoStr) {
    if (!isoStr) return "-";
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
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
