// admin_teachers.js - Teacher & Faculty Management Controller

let allGradesList = [];
let allSubjectsList = [];
let currentAssignTeacherId = null;
let currentAssignTeacherData = null;
let currentTeacherModalMode = "create";
let debounceTimer = null;

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("teachers", "admin");
    loadGradesAndSubjects();
    loadTeachers();
});

async function loadGradesAndSubjects() {
    try {
        const [gradesRes, subjectsRes] = await Promise.all([
            fetch("/api/grades"),
            fetch("/api/admin/subjects", {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            })
        ]);

        allGradesList = await gradesRes.json();
        const subData = await subjectsRes.json();
        allSubjectsList = subData.subjects || [];

        const inchargeSelect = document.getElementById("modalTeacherIncharge");
        if (inchargeSelect && Array.isArray(allGradesList)) {
            inchargeSelect.innerHTML = `<option value="">None (Standard Subject Teacher)</option>` +
                allGradesList.map(g => `<option value="${g.grade_id}">${escapeHtml(g.grade_name)} (${g.grade_id})</option>`).join("");
        }

        const assignSelect = document.getElementById("assignSubjectSelect");
        if (assignSelect && Array.isArray(allSubjectsList)) {
            assignSelect.innerHTML = `<option value="">-- Choose Subject --</option>` +
                allSubjectsList.map(s => `<option value="${s.subject_id}">${escapeHtml(s.subject_name)} - ${escapeHtml(s.grade_name || s.grade_id)} (${s.subject_id})</option>`).join("");
        }
    } catch (err) {
        console.error("Error loading catalogs for teachers page:", err);
    }
}

function debounceLoadTeachers() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadTeachers, 300);
}

async function loadTeachers() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const search = document.getElementById("searchTeacherInput").value;
    const status = document.getElementById("statusFilterSelect").value;

    const tbody = document.getElementById("teachersTbody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 25px;">Loading teacher records...</td></tr>`;

    try {
        const url = `/api/admin/teachers?search=${encodeURIComponent(search)}&is_active=${encodeURIComponent(status)}&limit=100`;
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 25px;">${escapeHtml(data.message || 'Error')}</td></tr>`;
            return;
        }

        const teachers = data.teachers || [];
        if (teachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 25px;">No teachers found.</td></tr>`;
            return;
        }

        tbody.innerHTML = teachers.map(t => {
            const isActive = t.is_active !== false;
            const inchargeHtml = t.incharge_grade_id 
                ? `<span style="background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid #22c55e; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">🌟 ${escapeHtml(t.incharge_grade_name || t.incharge_grade_id)}</span>`
                : `<span style="color: #94a3b8; font-size: 12px;">-</span>`;

            const subjectsHtml = (t.assigned_subjects && t.assigned_subjects.length > 0)
                ? t.assigned_subjects.map(s => `<span class="subBadge">${escapeHtml(s.subject_name)} (${escapeHtml(s.grade_name || s.subject_id)})</span>`).join(" ")
                : `<span style="color: #64748b; font-size: 11px; font-style: italic;">No subjects assigned</span>`;

            return `
                <tr>
                    <td><strong>${escapeHtml(t.teacher_reg_no || String(t.teacher_id))}</strong></td>
                    <td>
                        <div style="font-weight: 700;">${escapeHtml(t.teacher_name)}</div>
                        <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(t.address || '')}</div>
                    </td>
                    <td>${inchargeHtml}</td>
                    <td>${subjectsHtml}</td>
                    <td>
                        <div><i class="fa fa-envelope" style="color: #94a3b8; font-size: 11px;"></i> ${escapeHtml(t.email)}</div>
                        <div style="font-size: 12px; color: #94a3b8;"><i class="fa fa-phone" style="font-size: 11px;"></i> ${escapeHtml(t.phone_number || 'N/A')}</div>
                    </td>
                    <td>
                        <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">
                            ${isActive ? 'Active' : 'Deactivated'}
                        </span>
                    </td>
                    <td>
                        <button class="rowBtn edit" onclick="openTeacherModal('edit', ${JSON.stringify(t).replace(/"/g, '&quot;')})">
                            <i class="fa fa-pencil"></i> Edit
                        </button>
                        <button class="rowBtn assign" onclick="openAssignSubjectsModal(${JSON.stringify(t).replace(/"/g, '&quot;')})">
                            <i class="fa fa-book-open"></i> Subjects
                        </button>
                        <button class="rowBtn ${isActive ? 'toggle' : 'activate'}" onclick="toggleTeacherActive(${t.teacher_id}, ${isActive})">
                            <i class="fa ${isActive ? 'fa-ban' : 'fa-check'}"></i> ${isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Error loading teachers:", err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 25px;">Failed to load teachers.</td></tr>`;
    }
}

function openTeacherModal(mode, teacherData = null) {
    currentTeacherModalMode = mode;
    const modal = document.getElementById("teacherModal");
    const title = document.getElementById("teacherModalTitle");
    const pwdLabel = document.getElementById("modalTeacherPasswordLabel");
    const pwdInput = document.getElementById("modalTeacherPassword");
    const regInput = document.getElementById("modalTeacherRegNo");

    if (!modal) return;

    if (mode === "create") {
        title.innerHTML = `<i class="fa fa-user-plus" style="color: #00bcd4;"></i> Register New Teacher`;
        document.getElementById("teacherForm").reset();
        document.getElementById("modalTeacherId").value = "";
        pwdLabel.textContent = "Password *";
        pwdInput.required = true;
        pwdInput.placeholder = "Min 6 characters";
        regInput.disabled = false;
    } else if (mode === "edit" && teacherData) {
        title.innerHTML = `<i class="fa fa-user-pen" style="color: #38bdf8;"></i> Edit Teacher Profile`;
        document.getElementById("modalTeacherId").value = teacherData.teacher_id;
        document.getElementById("modalTeacherName").value = teacherData.teacher_name || "";
        document.getElementById("modalTeacherRegNo").value = teacherData.teacher_reg_no || "";
        document.getElementById("modalTeacherIncharge").value = teacherData.incharge_grade_id || "";
        document.getElementById("modalTeacherEmail").value = teacherData.email || "";
        document.getElementById("modalTeacherPhone").value = teacherData.phone_number || "";
        document.getElementById("modalTeacherAddress").value = teacherData.address || "";
        pwdLabel.textContent = "Reset Password (Leave blank to keep current)";
        pwdInput.required = false;
        pwdInput.placeholder = "Enter new password if changing";
        regInput.disabled = true;
    }

    modal.style.display = "flex";
}

function closeTeacherModal() {
    const modal = document.getElementById("teacherModal");
    if (modal) modal.style.display = "none";
}

async function handleSaveTeacher(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const teacherId = document.getElementById("modalTeacherId").value;
    const name = document.getElementById("modalTeacherName").value.trim();
    const regNo = document.getElementById("modalTeacherRegNo").value.trim();
    const incharge = document.getElementById("modalTeacherIncharge").value || null;
    const email = document.getElementById("modalTeacherEmail").value.trim();
    const phone = document.getElementById("modalTeacherPhone").value.trim();
    const address = document.getElementById("modalTeacherAddress").value.trim();
    const password = document.getElementById("modalTeacherPassword").value;

    const bodyObj = {
        teacher_name: name,
        teacher_reg_no: regNo,
        incharge_grade_id: incharge,
        email,
        phone_number: phone,
        address,
        password: password || undefined
    };

    try {
        let response;
        if (currentTeacherModalMode === "create") {
            response = await fetch("/api/admin/teachers", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bodyObj)
            });
        } else {
            response = await fetch(`/api/admin/teachers/${teacherId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bodyObj)
            });
        }

        const data = await response.json();
        alert(data.message);
        if (data.success) {
            closeTeacherModal();
            loadTeachers();
        }
    } catch (err) {
        console.error("Error saving teacher:", err);
        alert("Failed to save teacher.");
    }
}

function openAssignSubjectsModal(teacherData) {
    currentAssignTeacherId = teacherData.teacher_id;
    currentAssignTeacherData = teacherData;

    document.getElementById("assignTeacherName").textContent = `${teacherData.teacher_name} (${teacherData.teacher_reg_no})`;
    renderAssignedSubjectsList();

    document.getElementById("assignSubjectsModal").style.display = "flex";
}

function closeAssignSubjectsModal() {
    document.getElementById("assignSubjectsModal").style.display = "none";
    loadTeachers();
}

function renderAssignedSubjectsList() {
    const container = document.getElementById("currentAssignedSubjectsList");
    if (!container || !currentAssignTeacherData) return;

    const subs = currentAssignTeacherData.assigned_subjects || [];
    if (subs.length === 0) {
        container.innerHTML = `<p style="color: #94a3b8; font-size: 13px;">No subjects currently assigned to this teacher.</p>`;
        return;
    }

    container.innerHTML = subs.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
            <span style="font-size: 13px; color: #fff;"><strong>${escapeHtml(s.subject_name)}</strong> &bull; ${escapeHtml(s.grade_name || s.subject_id)}</span>
            <button type="button" class="rowBtn toggle" style="padding: 3px 8px; font-size: 11px;" onclick="handleUnassignSubject('${s.subject_id}')">
                <i class="fa fa-trash"></i> Remove
            </button>
        </div>
    `).join("");
}

async function handleAssignSubject() {
    const subjectId = document.getElementById("assignSubjectSelect").value;
    if (!subjectId) return alert("Please select a subject to assign.");

    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/admin/assign-teacher", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ teacher_id: currentAssignTeacherId, subject_id: subjectId })
        });
        const data = await res.json();
        alert(data.message);

        // Refresh teacher list and current teacher's subjects
        const tRes = await fetch(`/api/admin/teachers?search=${currentAssignTeacherData.teacher_reg_no}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const tData = await tRes.json();
        if (tData.teachers && tData.teachers.length > 0) {
            currentAssignTeacherData = tData.teachers[0];
            renderAssignedSubjectsList();
        }
    } catch (err) {
        console.error("Error assigning subject:", err);
        alert("Failed to assign subject.");
    }
}

async function handleUnassignSubject(subjectId) {
    if (!confirm("Are you sure you want to unassign this subject?")) return;

    const token = localStorage.getItem("token");
    try {
        const res = await fetch("/api/admin/unassign-teacher", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ teacher_id: currentAssignTeacherId, subject_id: subjectId })
        });
        const data = await res.json();
        alert(data.message);

        // Refresh teacher's subjects
        const tRes = await fetch(`/api/admin/teachers?search=${currentAssignTeacherData.teacher_reg_no}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const tData = await tRes.json();
        if (tData.teachers && tData.teachers.length > 0) {
            currentAssignTeacherData = tData.teachers[0];
            renderAssignedSubjectsList();
        }
    } catch (err) {
        console.error("Error unassigning subject:", err);
        alert("Failed to unassign subject.");
    }
}

async function toggleTeacherActive(teacherId, isCurrentlyActive) {
    const action = isCurrentlyActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} this teacher?`)) return;

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`/api/admin/teachers/${teacherId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
        loadTeachers();
    } catch (err) {
        console.error("Error updating teacher status:", err);
        alert("Could not update teacher status.");
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
