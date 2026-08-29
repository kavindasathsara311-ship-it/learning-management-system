// teacher_exam.js - Teacher Exam Scheduling, Management, and Results Publishing

let teacherClasses = [];
let teacherExams = [];

document.addEventListener("DOMContentLoaded", () => {
    loadTeacherClassesForExam();
    loadTeacherExamsList();
});

function switchExamTab(tabName) {
    document.querySelectorAll(".examTabBtn").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".examTabContent").forEach(tab => tab.style.display = "none");

    const activeBtn = document.getElementById(`tabBtn_${tabName}`);
    const activeTab = document.getElementById(`tabContent_${tabName}`);

    if (activeBtn) activeBtn.classList.add("active");
    if (activeTab) activeTab.style.display = "block";

    if (tabName === 'manage') loadTeacherExamsList();
    if (tabName === 'results') loadExamsDropdownForResults();
}

async function loadTeacherClassesForExam() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/view-classes`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        teacherClasses = data.classes || [];

        const subjectSelect = document.getElementById("examSubjectSelect");
        if (subjectSelect) {
            subjectSelect.innerHTML = teacherClasses.map(c => `
                <option value="${c.subject_id}" data-grade="${c.grade_id || c.grade_name || ''}">${escapeHtml(c.subject_name)} (${escapeHtml(c.grade_name || c.subject_id)})</option>
            `).join("");
        }

        // Also populate grade options
        const gradeSelect = document.getElementById("examGradeSelect");
        if (gradeSelect) {
            const gradesRes = await fetch(`${API_BASE}/api/grades`);
            const grades = await gradesRes.json();
            if (Array.isArray(grades)) {
                gradeSelect.innerHTML = grades.map(g => `
                    <option value="${g.grade_id}">${escapeHtml(g.grade_name)}</option>
                `).join("");
            }
        }
    } catch (err) {
        console.error("Error loading classes for exams:", err);
    }
}

async function handleScheduleExam(e) {
    e.preventDefault();
    const examName = document.getElementById("examNameInput").value.trim();
    const gradeId = document.getElementById("examGradeSelect").value;
    const subjectId = document.getElementById("examSubjectSelect").value;
    const examDate = document.getElementById("examDateInput").value;
    const examTime = document.getElementById("examTimeInput").value;

    if (!examName || !gradeId || !subjectId || !examDate || !examTime) {
        alert("Please complete all exam scheduling fields.");
        return;
    }

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/schedule-exam`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                exam_name: examName,
                grade_id: gradeId,
                subject_id: subjectId,
                date: examDate,
                time: examTime
            })
        });

        const data = await res.json();
        alert(data.message || "Exam scheduled successfully!");
        if (data.success) {
            document.getElementById("examNameInput").value = "";
            switchExamTab("manage");
        }
    } catch (err) {
        console.error("Error scheduling exam:", err);
        alert("Failed to schedule exam.");
    }
}

async function loadTeacherExamsList() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const container = document.getElementById("manageExamsContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/api/teacher-exams`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        teacherExams = data.exams || [];

        if (teacherExams.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #94a3b8;">
                    <i class="fa fa-calendar-times" style="font-size: 36px; margin-bottom: 10px; color: #cbd5e1;"></i>
                    <p style="margin: 0;">No exams scheduled for your teaching subjects yet.</p>
                </div>
            `;
            return;
        }

        let html = `
            <table class="tableContainer" style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden; color: #fff;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.12); text-align: left; font-size: 13px; text-transform: uppercase;">
                        <th style="padding: 14px 16px;">Exam Title</th>
                        <th style="padding: 14px 16px;">Subject</th>
                        <th style="padding: 14px 16px;">Grade</th>
                        <th style="padding: 14px 16px;">Date</th>
                        <th style="padding: 14px 16px;">Time</th>
                        <th style="padding: 14px 16px; text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        teacherExams.forEach(ex => {
            const dateStr = new Date(ex.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric"
            });

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <td style="padding: 14px 16px;"><strong>${escapeHtml(ex.exam_name)}</strong></td>
                    <td style="padding: 14px 16px; color: #38bdf8;">${escapeHtml(ex.subject_name)}</td>
                    <td style="padding: 14px 16px;">${escapeHtml(ex.grade_name || ex.grade_id)}</td>
                    <td style="padding: 14px 16px;">${dateStr}</td>
                    <td style="padding: 14px 16px;">${escapeHtml(ex.time || '')}</td>
                    <td style="padding: 14px 16px; text-align: right;">
                        <button onclick="prepareResultsForExam(${ex.exam_id}, '${ex.subject_id}')" 
                                style="background: #22c55e; color: white; border: none; padding: 7px 14px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                            <i class="fa fa-award"></i> Enter Marks
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("Error loading exams:", err);
        container.innerHTML = `<p style="color:#ef4444; padding: 20px;">Failed to load scheduled exams.</p>`;
    }
}

async function loadExamsDropdownForResults() {
    const select = document.getElementById("resultsExamSelect");
    if (!select) return;

    if (teacherExams.length === 0) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/teacher-exams`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        teacherExams = data.exams || [];
    }

    if (teacherExams.length > 0) {
        select.innerHTML = teacherExams.map(ex => `
            <option value="${ex.exam_id}_${ex.subject_id}">
                ${escapeHtml(ex.exam_name)} - ${escapeHtml(ex.subject_name)} (${escapeHtml(ex.grade_name || ex.grade_id)})
            </option>
        `).join("");
        loadRosterForResults();
    } else {
        select.innerHTML = `<option value="">No exams available</option>`;
    }
}

function prepareResultsForExam(examId, subjectId) {
    switchExamTab("results");
    const select = document.getElementById("resultsExamSelect");
    if (select) {
        select.value = `${examId}_${subjectId}`;
        loadRosterForResults();
    }
}

async function loadRosterForResults() {
    const select = document.getElementById("resultsExamSelect");
    const container = document.getElementById("resultsRosterContainer");
    if (!select || !container || !select.value) return;

    const [examId, subjectId] = select.value.split("_");
    const token = localStorage.getItem("token");

    container.innerHTML = `<p style="color:#94a3b8; padding: 20px;">Loading student class roster...</p>`;

    try {
        const res = await fetch(`${API_BASE}/api/class-roster?subject_id=${encodeURIComponent(subjectId)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        const students = data.students || [];

        if (students.length === 0) {
            container.innerHTML = `<p style="color:#94a3b8; padding: 20px;">No students enrolled in this subject roster.</p>`;
            return;
        }

        let html = `
            <table class="tableContainer" style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden; color: #fff;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.12); text-align: left; font-size: 13px; text-transform: uppercase;">
                        <th style="padding: 14px 16px;">Reg No</th>
                        <th style="padding: 14px 16px;">Student Name</th>
                        <th style="padding: 14px 16px; width: 140px;">Marks Obtained</th>
                        <th style="padding: 14px 16px; width: 120px;">Max Marks</th>
                        <th style="padding: 14px 16px; width: 100px;">Grade</th>
                    </tr>
                </thead>
                <tbody>
        `;

        students.forEach(s => {
            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <td style="padding: 12px 16px;"><strong>${escapeHtml(s.student_reg_no)}</strong></td>
                    <td style="padding: 12px 16px;">${escapeHtml(s.student_name)}</td>
                    <td style="padding: 12px 16px;">
                        <input type="number" class="studentMarksInput" data-student-id="${s.student_id}" placeholder="Score" min="0" max="100" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: #1e293b; color: #fff;">
                    </td>
                    <td style="padding: 12px 16px;">
                        <input type="number" class="studentMaxMarksInput" data-student-id="${s.student_id}" value="100" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: #1e293b; color: #fff;">
                    </td>
                    <td style="padding: 12px 16px;">
                        <select class="studentGradeSelect" data-student-id="${s.student_id}" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: #1e293b; color: #fff;">
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="S">S</option>
                            <option value="F">F</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("Error loading roster for results:", err);
        container.innerHTML = `<p style="color:#ef4444; padding: 20px;">Failed to load class roster.</p>`;
    }
}

async function savePublishedResults() {
    const select = document.getElementById("resultsExamSelect");
    if (!select || !select.value) return;

    const [examId, subjectId] = select.value.split("_");
    const marksInputs = document.querySelectorAll(".studentMarksInput");
    const token = localStorage.getItem("token");

    const results = [];
    marksInputs.forEach(inp => {
        const studentId = inp.getAttribute("data-student-id");
        const marks = parseFloat(inp.value) || 0;
        const maxInput = document.querySelector(`.studentMaxMarksInput[data-student-id="${studentId}"]`);
        const gradeInput = document.querySelector(`.studentGradeSelect[data-student-id="${studentId}"]`);

        results.push({
            student_id: studentId,
            marks_obtained: marks,
            max_marks: maxInput ? parseFloat(maxInput.value) || 100 : 100,
            grade: gradeInput ? gradeInput.value : "C"
        });
    });

    if (results.length === 0) {
        alert("No results to publish.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/api/publish-results`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                exam_id: parseInt(examId, 10),
                subject_id: subjectId,
                results
            })
        });

        const data = await res.json();
        alert(data.message || "Results published successfully!");
    } catch (err) {
        console.error("Error saving results:", err);
        alert("Failed to publish results.");
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
