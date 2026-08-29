// admin_subjects.js - Subjects & Class Catalog Controller

let allGradesList = [];
let allTeachersList = [];
let debounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("subjects", "admin");
    loadGradesAndTeachers();
    loadSubjects();
    loadSections();
});

async function loadGradesAndTeachers() {
    const token = localStorage.getItem("token");
    try {
        const [gradesRes, teachersRes] = await Promise.all([
            fetch("/api/grades"),
            fetch("/api/admin/teachers?limit=200", {
                headers: { "Authorization": `Bearer ${token}` }
            })
        ]);

        allGradesList = await gradesRes.json();
        const tData = await teachersRes.json();
        allTeachersList = tData.teachers || [];

        const filterSelect = document.getElementById("gradeFilterSelect");
        const modalGradeSelect = document.getElementById("modalSubjectGrade");
        const modalTeacherSelect = document.getElementById("modalSubjectTeacher");

        if (Array.isArray(allGradesList)) {
            const optionsHtml = allGradesList.map(g => `<option value="${g.grade_id}">${escapeHtml(g.grade_name)} (${g.grade_id})</option>`).join("");
            if (filterSelect) filterSelect.innerHTML = `<option value="all">All Grades</option>` + optionsHtml;
            if (modalGradeSelect) modalGradeSelect.innerHTML = `<option value="">-- Select Grade / Class --</option>` + optionsHtml;
        }

        if (modalTeacherSelect && Array.isArray(allTeachersList)) {
            modalTeacherSelect.innerHTML = `<option value="">-- Assign Later --</option>` +
                allTeachersList.map(t => `<option value="${t.teacher_id}">${escapeHtml(t.teacher_name)} (${t.teacher_reg_no})</option>`).join("");
        }
    } catch (err) {
        console.error("Error loading dropdown options:", err);
    }
}

function debounceLoadSubjects() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadSubjects, 300);
}

async function loadSubjects() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const search = document.getElementById("searchSubjectInput").value;
    const gradeId = document.getElementById("gradeFilterSelect").value;

    const tbody = document.getElementById("subjectsTbody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 25px;">Loading subjects...</td></tr>`;

    try {
        const url = `/api/admin/subjects?search=${encodeURIComponent(search)}&grade_id=${encodeURIComponent(gradeId)}`;
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #f87171; padding: 25px;">${escapeHtml(data.message || 'Error')}</td></tr>`;
            return;
        }

        const subjects = data.subjects || [];
        if (subjects.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 25px;">No subjects found matching criteria.</td></tr>`;
            return;
        }

        tbody.innerHTML = subjects.map(s => {
            const teachersHtml = (s.teachers && s.teachers.length > 0)
                ? s.teachers.map(t => `<span class="teacherTag"><i class="fa fa-chalkboard-teacher"></i> ${escapeHtml(t.teacher_name)}</span>`).join(" ")
                : `<span style="color: #64748b; font-size: 11px; font-style: italic;">No faculty assigned</span>`;

            return `
                <tr>
                    <td><strong>${escapeHtml(s.subject_id)}</strong></td>
                    <td style="font-weight: 700;">${escapeHtml(s.subject_name)}</td>
                    <td><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-size: 12px;">${escapeHtml(s.grade_name || s.grade_id)}</span></td>
                    <td>${teachersHtml}</td>
                    <td><i class="fa fa-user-graduate" style="color: #38bdf8;"></i> ${s.enrolled_count || 0} Students</td>
                    <td>
                        <span style="color: #cbd5e1; font-size: 12px;">
                            <i class="fa fa-file-lines" style="color: #facc15;"></i> ${s.materials_count || 0} Materials &bull;
                            <i class="fa fa-tasks" style="color: #4ade80;"></i> ${s.assignments_count || 0} Assignments
                        </span>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Error fetching subjects:", err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #f87171; padding: 25px;">Failed to load subjects.</td></tr>`;
    }
}

async function loadSections() {
    const token = localStorage.getItem("token");
    const tbody = document.getElementById("sectionsTbody");
    if (!tbody || !token) return;

    try {
        const response = await fetch("/api/admin/sections", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (!data.success || !data.sections) return;

        tbody.innerHTML = data.sections.map(sec => `
            <tr>
                <td><strong>${escapeHtml(sec.grade_id)}</strong></td>
                <td style="font-weight: 700;">${escapeHtml(sec.grade_name)}</td>
                <td><i class="fa fa-users" style="color: #38bdf8;"></i> ${sec.student_count || 0} Enrolled</td>
                <td><i class="fa fa-book" style="color: #c084fc;"></i> ${sec.subject_count || 0} Subjects</td>
                <td>${sec.incharge_teacher ? `<span style="color: #4ade80; font-weight: bold;">🌟 ${escapeHtml(sec.incharge_teacher)}</span>` : '<span style="color: #64748b; font-style: italic;">Not assigned</span>'}</td>
            </tr>
        `).join("");

    } catch (err) {
        console.error("Error loading sections:", err);
    }
}

function openSubjectModal() {
    const modal = document.getElementById("subjectModal");
    if (modal) modal.style.display = "flex";
}

function closeSubjectModal() {
    const modal = document.getElementById("subjectModal");
    if (modal) modal.style.display = "none";
}

async function handleCreateSubject(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const subjectId = document.getElementById("modalSubjectId").value.trim();
    const subjectName = document.getElementById("modalSubjectName").value.trim();
    const gradeId = document.getElementById("modalSubjectGrade").value;
    const teacherId = document.getElementById("modalSubjectTeacher").value || null;

    try {
        const res = await fetch("/api/admin/subjects", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ subject_id: subjectId, subject_name: subjectName, grade_id: gradeId, teacher_id: teacherId })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
            closeSubjectModal();
            loadSubjects();
            loadSections();
        }
    } catch (err) {
        console.error("Error creating subject:", err);
        alert("Failed to create subject.");
    }
}

function openSectionModal() {
    const modal = document.getElementById("sectionModal");
    if (modal) modal.style.display = "flex";
}

function closeSectionModal() {
    const modal = document.getElementById("sectionModal");
    if (modal) modal.style.display = "none";
}

async function handleCreateSection(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const gradeId = document.getElementById("modalSectionId").value.trim();
    const gradeName = document.getElementById("modalSectionName").value.trim();

    try {
        const res = await fetch("/api/admin/sections", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ grade_id: gradeId, grade_name: gradeName })
        });
        const data = await res.json();
        alert(data.message);
        if (data.success) {
            closeSectionModal();
            loadGradesAndTeachers();
            loadSections();
        }
    } catch (err) {
        console.error("Error creating section:", err);
        alert("Failed to create section.");
    }
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
