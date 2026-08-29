// teacher_attendence.js - Daily Class & Subject Attendance

let currentStudentsList = [];
let currentSubjectId = "";

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
    loadTeacherClassesDropdown();
});

async function loadTeacherClassesDropdown() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "LoginPage.html";
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/view-classes`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        const select = document.getElementById("gradeSelect");
        if (!select) return;

        if (data.classes && data.classes.length > 0) {
            select.innerHTML = data.classes.map(c => `
                <option value="${c.subject_id}">${escapeHtml(c.subject_name)} (${escapeHtml(c.grade_name || c.subject_id)})</option>
            `).join("");
            currentSubjectId = data.classes[0].subject_id;
            loadTeacherAttendance();
        } else {
            select.innerHTML = `<option value="">No classes assigned</option>`;
            renderEmptyAttendance("No assigned classes found. Please contact administration.");
        }
    } catch (err) {
        console.error("Error loading teacher classes:", err);
    }
}

async function loadTeacherAttendance() {
    const classSelect = document.getElementById("gradeSelect");
    const dateInput = document.getElementById("attendanceDate");

    currentSubjectId = classSelect ? classSelect.value : "";
    const date = dateInput ? dateInput.value : "";

    if (!currentSubjectId) {
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/teacher-attendance-view?subject_id=${encodeURIComponent(currentSubjectId)}&date=${encodeURIComponent(date)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) {
            alert(data.message || "Failed to load attendance");
            return;
        }

        currentStudentsList = data.records || [];
        renderTeacherAttendanceTable();

    } catch (err) {
        console.error("Error loading teacher attendance:", err);
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

        const reasonHtml = student.reason ? `<span class="reasonBox"><i class="fas fa-info-circle"></i> ${escapeHtml(student.reason)}</span>` : (isAbsent ? `<span style="color: #ef4444; font-size:12px;">Absent</span>` : `-`);

        tr.innerHTML = `
            <td><strong>${escapeHtml(student.student_reg_no || String(student.student_id))}</strong></td>
            <td>${escapeHtml(student.student_name)}</td>
            <td>
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
            </td>
            <td>${reasonHtml}</td>
        `;
        tbody.appendChild(tr);
    });

    updateStats();
}

function updateStudentStatus(studentId, newStatus) {
    const student = currentStudentsList.find(s => String(s.student_id) === String(studentId));
    if (student) {
        student.status = newStatus;
        updateStats();
    }
}

function markAllPresent() {
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
    const dateInput = document.getElementById("attendanceDate");
    const date = dateInput ? dateInput.value : "";

    if (!currentSubjectId) {
        alert("Please select a class/subject first.");
        return;
    }

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

    try {
        const response = await fetch(`${API_BASE}/api/mark-attendance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ subject_id: currentSubjectId, date, records })
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
