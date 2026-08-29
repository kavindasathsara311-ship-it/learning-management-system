// admin_students.js - Student Management Controller

let allGradesList = [];
let debounceTimer = null;
let currentModalMode = "create";

document.addEventListener("DOMContentLoaded", () => {
    renderSidebar("students", "admin");
    loadGradesList();
    loadStudents();
});

async function loadGradesList() {
    try {
        const res = await fetch("/api/grades");
        allGradesList = await res.json();

        const filterSelect = document.getElementById("gradeFilterSelect");
        const modalSelect = document.getElementById("modalStudentGrade");

        if (Array.isArray(allGradesList)) {
            const optionsHtml = allGradesList.map(g => `<option value="${g.grade_id}">${escapeHtml(g.grade_name)} (${g.grade_id})</option>`).join("");
            if (filterSelect) filterSelect.innerHTML = `<option value="all">All Grades</option>` + optionsHtml;
            if (modalSelect) modalSelect.innerHTML = `<option value="">-- Select Grade / Class --</option>` + optionsHtml;
        }
    } catch (err) {
        console.error("Error loading grades:", err);
    }
}

function debounceLoadStudents() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadStudents, 300);
}

async function loadStudents() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const search = document.getElementById("searchStudentInput").value;
    const gradeId = document.getElementById("gradeFilterSelect").value;
    const status = document.getElementById("statusFilterSelect").value;

    const tbody = document.getElementById("studentsTbody");
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 25px;">Loading students...</td></tr>`;

    try {
        const url = `/api/admin/students?search=${encodeURIComponent(search)}&grade_id=${encodeURIComponent(gradeId)}&is_active=${encodeURIComponent(status)}&limit=100`;
        const response = await fetch(url, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 25px;">${escapeHtml(data.message || 'Error')}</td></tr>`;
            return;
        }

        const students = data.students || [];
        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 25px;">No students found matching current filters.</td></tr>`;
            return;
        }

        tbody.innerHTML = students.map(s => {
            const isActive = s.is_active !== false;
            return `
                <tr>
                    <td><strong>${escapeHtml(s.student_reg_no || String(s.student_id))}</strong></td>
                    <td>
                        <div style="font-weight: 700;">${escapeHtml(s.student_name)}</div>
                        <div style="font-size: 11px; color: #94a3b8;">${escapeHtml(s.address || '')}</div>
                    </td>
                    <td><span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;">${escapeHtml(s.grade_name || s.grade_id || 'Unassigned')}</span></td>
                    <td>
                        <div><i class="fa fa-envelope" style="color: #94a3b8; font-size: 11px;"></i> ${escapeHtml(s.email)}</div>
                        <div style="font-size: 12px; color: #94a3b8;"><i class="fa fa-phone" style="font-size: 11px;"></i> ${escapeHtml(s.phone_number || 'N/A')}</div>
                    </td>
                    <td><i class="fa fa-book" style="color: #c084fc;"></i> ${s.enrolled_subjects_count || 0} Courses</td>
                    <td>
                        <span class="badge ${isActive ? 'badge-active' : 'badge-inactive'}">
                            ${isActive ? 'Active' : 'Deactivated'}
                        </span>
                    </td>
                    <td>
                        <button class="rowBtn edit" onclick="openStudentModal('edit', ${JSON.stringify(s).replace(/"/g, '&quot;')})">
                            <i class="fa fa-pencil"></i> Edit
                        </button>
                        <button class="rowBtn ${isActive ? 'toggle' : 'activate'}" onclick="toggleStudentActive(${s.student_id}, ${isActive})">
                            <i class="fa ${isActive ? 'fa-ban' : 'fa-check'}"></i> ${isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

    } catch (err) {
        console.error("Error fetching students:", err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #f87171; padding: 25px;">Failed to load students.</td></tr>`;
    }
}

function openStudentModal(mode, studentData = null) {
    currentModalMode = mode;
    const modal = document.getElementById("studentModal");
    const title = document.getElementById("studentModalTitle");
    const pwdLabel = document.getElementById("modalPasswordLabel");
    const pwdInput = document.getElementById("modalStudentPassword");
    const regInput = document.getElementById("modalStudentRegNo");

    if (!modal) return;

    if (mode === "create") {
        title.innerHTML = `<i class="fa fa-user-plus" style="color: #00bcd4;"></i> Register New Student`;
        document.getElementById("studentForm").reset();
        document.getElementById("modalStudentId").value = "";
        pwdLabel.textContent = "Password *";
        pwdInput.required = true;
        pwdInput.placeholder = "Min 6 characters";
        regInput.disabled = false;
    } else if (mode === "edit" && studentData) {
        title.innerHTML = `<i class="fa fa-user-pen" style="color: #38bdf8;"></i> Edit Student Profile`;
        document.getElementById("modalStudentId").value = studentData.student_id;
        document.getElementById("modalStudentName").value = studentData.student_name || "";
        document.getElementById("modalStudentRegNo").value = studentData.student_reg_no || "";
        document.getElementById("modalStudentGrade").value = studentData.grade_id || "";
        document.getElementById("modalStudentEmail").value = studentData.email || "";
        document.getElementById("modalStudentPhone").value = studentData.phone_number || "";
        document.getElementById("modalStudentAddress").value = studentData.address || "";
        pwdLabel.textContent = "Reset Password (Leave blank to keep current)";
        pwdInput.required = false;
        pwdInput.placeholder = "Enter new password if changing";
        regInput.disabled = true;
    }

    modal.style.display = "flex";
}

function closeStudentModal() {
    const modal = document.getElementById("studentModal");
    if (modal) modal.style.display = "none";
}

async function handleSaveStudent(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;

    const studentId = document.getElementById("modalStudentId").value;
    const name = document.getElementById("modalStudentName").value.trim();
    const regNo = document.getElementById("modalStudentRegNo").value.trim();
    const gradeId = document.getElementById("modalStudentGrade").value;
    const email = document.getElementById("modalStudentEmail").value.trim();
    const phone = document.getElementById("modalStudentPhone").value.trim();
    const address = document.getElementById("modalStudentAddress").value.trim();
    const password = document.getElementById("modalStudentPassword").value;

    const bodyObj = {
        student_name: name,
        student_reg_no: regNo,
        grade_id: gradeId,
        email,
        phone_number: phone,
        address,
        password: password || undefined
    };

    try {
        let response;
        if (currentModalMode === "create") {
            response = await fetch("/api/admin/students", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(bodyObj)
            });
        } else {
            response = await fetch(`/api/admin/students/${studentId}`, {
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
            closeStudentModal();
            loadStudents();
        }
    } catch (err) {
        console.error("Error saving student:", err);
        alert("Failed to save student record.");
    }
}

async function toggleStudentActive(studentId, isCurrentlyActive) {
    const action = isCurrentlyActive ? "deactivate" : "activate";
    if (!confirm(`Are you sure you want to ${action} this student?`)) return;

    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`/api/admin/students/${studentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        alert(data.message);
        loadStudents();
    } catch (err) {
        console.error("Error updating student status:", err);
        alert("Could not update student status.");
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
