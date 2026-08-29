// teacher_attendence.js - Daily Class & Subject Attendance with In-Charge Teacher Enforcement

let currentStudentsList = [];
let currentSelection = "";
let canEditCurrentAttendance = false;
let teacherInchargeGradeId = null;
let teacherInchargeGradeName = "";

document.addEventListener("DOMContentLoaded", () => {
    // Set default date to today's local YYYY-MM-DD
    const dateInput = document.getElementById("attendanceDate");
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}`;
    }
    loadTeacherAttendanceContext();
});

async function loadTeacherAttendanceContext() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "LoginPage.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/teacher-attendance-context`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        const select = document.getElementById("gradeSelect");
        if (!select) return;

        teacherInchargeGradeId = data.incharge_grade_id || null;
        teacherInchargeGradeName = data.incharge_grade_name || data.incharge_grade_id || "";

        let html = "";

        if (teacherInchargeGradeId) {
            html += `
                <optgroup label="🌟 My In-Charged Class (Full Attendance Rights)">
                    <option value="incharge_${teacherInchargeGradeId}">Class: ${escapeHtml(teacherInchargeGradeName)} (${escapeHtml(teacherInchargeGradeId)}) [Class In-Charge]</option>
                </optgroup>
            `;
        }

        const teachingClasses = (data.classes || []).filter(c => c.grade_id !== teacherInchargeGradeId);
        if (teachingClasses.length > 0) {
            html += `
                <optgroup label="👁️ My Teaching Subjects (View-Only Attendance)">
                    ${teachingClasses.map(c => `
                        <option value="subject_${c.subject_id}">${escapeHtml(c.subject_name)} - ${escapeHtml(c.grade_name || c.grade_id)} (${escapeHtml(c.subject_id)})</option>
                    `).join("")}
                </optgroup>
            `;
        }

        if (!html) {
            select.innerHTML = `<option value="">No classes or in-charge assigned</option>`;
            renderEmptyAttendance("No assigned classes found. Please contact administration.");
            return;
        }

        select.innerHTML = html;
        currentSelection = select.value;
        loadTeacherAttendance();

    } catch (err) {
        console.error("Error loading teacher attendance context:", err);
    }
}

async function loadTeacherAttendance() {
    const classSelect = document.getElementById("gradeSelect");
    const dateInput = document.getElementById("attendanceDate");

    currentSelection = classSelect ? classSelect.value : "";
    const date = dateInput ? dateInput.value : "";

    if (!currentSelection) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    let url = "";
    if (currentSelection.startsWith("incharge_")) {
        const gradeId = currentSelection.replace("incharge_", "");
        url = `${API_BASE}/api/teacher-attendance-view?grade_id=${encodeURIComponent(gradeId)}&date=${encodeURIComponent(date)}`;
    } else {
        const subjectId = currentSelection.replace("subject_", "");
        url = `${API_BASE}/api/teacher-attendance-view?subject_id=${encodeURIComponent(subjectId)}&date=${encodeURIComponent(date)}`;
    }

    try {
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Failed to load attendance");
            return;
        }

        canEditCurrentAttendance = !!data.can_edit;
        currentStudentsList = data.records || [];
        renderRoleBanner(data);
        renderTeacherAttendanceTable();

    } catch (err) {
        console.error("Error loading teacher attendance:", err);
    }
}

function renderRoleBanner(data) {
    const banner = document.getElementById("attendanceRoleBanner");
    if (!banner) return;

    if (canEditCurrentAttendance) {
        banner.innerHTML = `
            <div style="background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; color: #ffffff;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa fa-circle-check" style="font-size: 20px; color: #22c55e;"></i>
                    <div>
                        <strong style="color: #4ade80;">Class In-Charge Attendance Mode:</strong>
                        <span style="color: #cbd5e1; font-size: 13px;"> You are the in-charge teacher for this class (${escapeHtml(data.incharge_grade_name || data.incharge_grade_id)}). You have permission to record and save daily attendance.</span>
                    </div>
                </div>
                <span style="background: #22c55e; color: #000; font-weight: bold; font-size: 11px; padding: 4px 10px; border-radius: 12px;">EDIT ACCESS</span>
            </div>
        `;
    } else {
        banner.innerHTML = `
            <div style="background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.4); border-radius: 8px; padding: 12px 18px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; color: #ffffff;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fa fa-eye" style="font-size: 20px; color: #38bdf8;"></i>
                    <div>
                        <strong style="color: #38bdf8;">Read-Only Attendance View:</strong>
                        <span style="color: #cbd5e1; font-size: 13px;"> You are viewing attendance for your subject class. Only the Class In-Charge teacher can record or update daily attendance.</span>
                    </div>
                </div>
                <span style="background: #0284c7; color: #fff; font-weight: bold; font-size: 11px; padding: 4px 10px; border-radius: 12px;">VIEW ONLY</span>
            </div>
        `;
    }

    // Toggle visibility/state of action buttons
    const markAllBtn = document.getElementById("markAllBtn");
    const saveBtn = document.getElementById("saveAttendanceBtn");

    if (markAllBtn) markAllBtn.style.display = canEditCurrentAttendance ? "inline-block" : "none";
    if (saveBtn) {
        saveBtn.style.display = canEditCurrentAttendance ? "inline-block" : "none";
        saveBtn.disabled = !canEditCurrentAttendance;
    }
}

function renderTeacherAttendanceTable() {
    const tbody = document.getElementById("teacherAttendanceTbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (currentStudentsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 25px; color: #94a3b8;">No students enrolled in this class roster.</td></tr>`;
        updateStats();
        return;
    }

    currentStudentsList.forEach(student => {
        const tr = document.createElement("tr");

        const isPresent = student.status === 'Present';
        const isAbsent = student.status === 'Absent';
        const isLate = student.status === 'Late';

        let statusControlHtml = "";
        if (canEditCurrentAttendance) {
            statusControlHtml = `
                <div class="statusGroup">
                    <label class="statusOption" style="color: #22c55e;">
                        <input type="radio" name="status_${student.student_id}" value="Present" ${isPresent ? 'checked' : ''} onchange="updateStudentStatus(${student.student_id}, 'Present')">
                        Present
                    </label>
                    <label class="statusOption" style="color: #ef4444;">
                        <input type="radio" name="status_${student.student_id}" value="Absent" ${isAbsent ? 'checked' : ''} onchange="updateStudentStatus(${student.student_id}, 'Absent')">
                        Absent
                    </label>
                    <label class="statusOption" style="color: #f59e0b;">
                        <input type="radio" name="status_${student.student_id}" value="Late" ${isLate ? 'checked' : ''} onchange="updateStudentStatus(${student.student_id}, 'Late')">
                        Late
                    </label>
                </div>
            `;
        } else {
            const badgeClass = isPresent ? 'badge-present' : isAbsent ? 'badge-absent' : 'badge-late';
            const badgeColor = isPresent ? '#22c55e' : isAbsent ? '#ef4444' : '#f59e0b';
            statusControlHtml = `
                <span class="badge ${badgeClass}" style="background: ${badgeColor}; color: #fff; padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 12px;">
                    ${escapeHtml(student.status || 'Present')}
                </span>
            `;
        }

        const reasonHtml = student.reason ? `<span class="reasonBox"><i class="fas fa-info-circle"></i> ${escapeHtml(student.reason)}</span>` : (isAbsent ? `<span style="color: #ef4444; font-size:12px;">Absent</span>` : `-`);

        tr.innerHTML = `
            <td><strong>${escapeHtml(student.student_reg_no || String(student.student_id))}</strong></td>
            <td>${escapeHtml(student.student_name)}</td>
            <td>${statusControlHtml}</td>
            <td>${reasonHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    updateStats();
}

function updateStudentStatus(studentId, newStatus) {
    if (!canEditCurrentAttendance) return;
    const student = currentStudentsList.find(s => String(s.student_id) === String(studentId));
    if (student) {
        student.status = newStatus;
        updateStats();
    }
}

function markAllPresent() {
    if (!canEditCurrentAttendance) return;
    currentStudentsList.forEach(s => s.status = 'Present');
    renderTeacherAttendanceTable();
}

function updateStats() {
    const total = currentStudentsList.length;
    const present = currentStudentsList.filter(s => s.status === 'Present').length;
    const absent = currentStudentsList.filter(s => s.status === 'Absent').length;
    const late = currentStudentsList.filter(s => s.status === 'Late').length;

    const statTotal = document.getElementById("statTotal");
    const statPresent = document.getElementById("statPresent");
    const statAbsent = document.getElementById("statAbsent");
    const statLate = document.getElementById("statLate");

    if (statTotal) statTotal.textContent = total;
    if (statPresent) statPresent.textContent = present;
    if (statAbsent) statAbsent.textContent = absent;
    if (statLate) statLate.textContent = late;
}

async function saveTeacherAttendance() {
    if (!canEditCurrentAttendance) {
        alert("Access Denied: Only the Class In-Charge teacher can take or update attendance for this class.");
        return;
    }

    const dateInput = document.getElementById("attendanceDate");
    const date = dateInput ? dateInput.value : "";

    if (currentStudentsList.length === 0) {
        alert("No students to save attendance for.");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    const records = currentStudentsList.map(s => ({
        student_id: s.student_id,
        status: s.status || "Present",
        reason: s.reason || ""
    }));

    let postBody = { date, records };
    if (currentSelection.startsWith("incharge_")) {
        postBody.grade_id = currentSelection.replace("incharge_", "");
    } else {
        postBody.subject_id = currentSelection.replace("subject_", "");
    }

    try {
        const response = await fetch(`${API_BASE}/api/mark-attendance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(postBody)
        });

        const data = await response.json();
        alert(data.message || "Attendance saved successfully!");
        if (data.success) {
            loadTeacherAttendance();
        }
    } catch (err) {
        console.error("Error saving attendance:", err);
        alert("Failed to save attendance.");
    }
}

function renderEmptyAttendance(msg) {
    const tbody = document.getElementById("teacherAttendanceTbody");
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 25px; color: #94a3b8;">${escapeHtml(msg)}</td></tr>`;
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
