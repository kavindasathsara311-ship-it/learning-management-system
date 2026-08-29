// student_dashboard.js - Enrolled subjects and course materials viewing

function viewEnrolledSubjects() {
    try {
        const payload = getTokenPayload();
        const token = localStorage.getItem("token");
        if (!token || !payload || payload.role !== "student") return;

        fetch(`${API_BASE}/student-subjects`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                const subjects = data.enrolled_subjects || [];
                const container = document.querySelector(".subjectCardContainer");
                if (!container) return;
                container.innerHTML = "";

                if (subjects.length === 0) {
                    container.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 12px; border: 1px dashed #cbd5e1;">
                            <i class="fa fa-book-open" style="font-size: 40px; color: #94a3b8; margin-bottom: 10px;"></i>
                            <h3 style="margin: 0 0 5px 0; color: #1e293b;">No Enrolled Subjects</h3>
                            <p style="margin: 0 0 15px 0;">Use the search bar above to find and enroll in your grade's subjects.</p>
                        </div>
                    `;
                    return;
                }

                subjects.forEach(subject => {
                    const card = document.createElement("div");
                    card.className = "subject_card";
                    card.setAttribute("data-subject-id", subject.subject_id);
                    card.innerHTML = `
                        <div style="font-size: 20px; font-weight: 700; margin-bottom: 4px;">${escapeHtml(subject.subject_name)}</div>
                        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 12px;">Subject Code: ${escapeHtml(subject.subject_id)}</div>
                        <button class="subjectMatBtn" onclick="event.stopPropagation(); openSubjectMaterials('${subject.subject_id}', '${escapeHtml(subject.subject_name)}')">
                            <i class="fa fa-folder-open"></i> Course Materials
                        </button>
                    `;

                    card.addEventListener('click', () => {
                        openSubjectMaterials(subject.subject_id, subject.subject_name);
                    });

                    container.appendChild(card);
                });
            })
            .catch(err => console.error("Error fetching subjects:", err));

    } catch (e) {
        console.error("Error decoding token:", e);
    }
}

async function openSubjectMaterials(subjectId, subjectName) {
    const modal = document.getElementById("courseMaterialsModal");
    const modalTitle = document.getElementById("matModalTitle");
    const modalBody = document.getElementById("matModalBody");

    if (!modal || !modalBody) return;

    modalTitle.innerHTML = `<i class="fa fa-folder-open" style="color: #38bdf8;"></i> ${escapeHtml(subjectName)} - Course Materials`;
    modalBody.innerHTML = `<p style="color: #64748b; text-align: center; padding: 30px;">Loading materials for ${escapeHtml(subjectName)}...</p>`;
    modal.style.display = "flex";

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/student-course-materials?subject_id=${encodeURIComponent(subjectId)}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success || !data.materials || data.materials.length === 0) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                    <i class="fa fa-folder-empty" style="font-size: 44px; color: #cbd5e1; margin-bottom: 12px;"></i>
                    <h3 style="margin: 0 0 6px 0; color: #1e293b;">No Materials Uploaded Yet</h3>
                    <p style="margin: 0;">Your instructor has not published any lesson notes or materials for this subject yet.</p>
                </div>
            `;
            return;
        }

        renderGroupedMaterials(data.materials, modalBody);

    } catch (err) {
        console.error("Error loading course materials:", err);
        modalBody.innerHTML = `<p style="color: #ef4444; padding: 20px; text-align: center;">Failed to load course materials.</p>`;
    }
}

async function viewAllMaterials() {
    const modal = document.getElementById("courseMaterialsModal");
    const modalTitle = document.getElementById("matModalTitle");
    const modalBody = document.getElementById("matModalBody");

    if (!modal || !modalBody) return;

    modalTitle.innerHTML = `<i class="fa fa-folder-open" style="color: #38bdf8;"></i> All Enrolled Course Materials`;
    modalBody.innerHTML = `<p style="color: #64748b; text-align: center; padding: 30px;">Loading all course materials...</p>`;
    modal.style.display = "flex";

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE}/api/student-course-materials`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();

        if (!data.success || !data.materials || data.materials.length === 0) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                    <i class="fa fa-folder-empty" style="font-size: 44px; color: #cbd5e1; margin-bottom: 12px;"></i>
                    <h3 style="margin: 0 0 6px 0; color: #1e293b;">No Course Materials Available</h3>
                    <p style="margin: 0;">No learning materials have been uploaded for your enrolled subjects yet.</p>
                </div>
            `;
            return;
        }

        renderGroupedMaterials(data.materials, modalBody);

    } catch (err) {
        console.error("Error loading all materials:", err);
        modalBody.innerHTML = `<p style="color: #ef4444; padding: 20px; text-align: center;">Failed to load materials.</p>`;
    }
}

function renderGroupedMaterials(materials, container) {
    // Group materials by Subject & Lesson
    const grouped = {};
    materials.forEach(mat => {
        const groupKey = `${mat.subject_name} - ${mat.lesson_name}`;
        if (!grouped[groupKey]) {
            grouped[groupKey] = {
                subject: mat.subject_name,
                lesson: mat.lesson_name,
                teacher: mat.teacher_name,
                items: []
            };
        }
        grouped[groupKey].items.push(mat);
    });

    let html = "";
    for (const key in grouped) {
        const group = grouped[key];
        html += `
            <div class="lessonGroup">
                <div class="lessonGroupHeader">
                    <i class="fa fa-bookmark" style="color: #00bcd4;"></i>
                    <span>${escapeHtml(group.subject)}: ${escapeHtml(group.lesson)}</span>
                    <span style="font-size: 12px; font-weight: normal; color: #64748b; margin-left: auto;">
                        Instructor: ${escapeHtml(group.teacher)}
                    </span>
                </div>
                <div>
                    ${group.items.map(item => {
                        const fileSize = formatBytes(item.file_size_bytes);
                        const fileDate = item.created_at ? new Date(item.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                        }) : "";
                        const fullFileUrl = item.file_url.startsWith("http") ? item.file_url : `${API_BASE}${item.file_url}`;

                        return `
                            <div class="matItemCard">
                                <div class="matItemInfo">
                                    <i class="fa fa-file-pdf matFileIcon"></i>
                                    <div class="matDetails">
                                        <h4>${escapeHtml(item.display_name)}</h4>
                                        <p>${fileSize} &bull; Uploaded: ${fileDate}</p>
                                    </div>
                                </div>
                                <a href="${fullFileUrl}" target="_blank" download="${escapeHtml(item.display_name)}" class="matDownloadBtn">
                                    <i class="fa fa-download"></i> Download / View
                                </a>
                            </div>
                        `;
                    }).join("")}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function closeMaterialsModal() {
    const modal = document.getElementById("courseMaterialsModal");
    if (modal) modal.style.display = "none";
}

function formatBytes(bytes) {
    if (!bytes || bytes === 0 || bytes === '0') return 'Document';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return 'Document';
    if (num < 1024) return num + ' B';
    else if (num < 1048576) return (num / 1024).toFixed(1) + ' KB';
    else return (num / 1048576).toFixed(2) + ' MB';
}

function searchSubjects() {
    const input = document.getElementById("subjectSearchInput");
    const searchVal = input ? input.value.trim() : "";

    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${API_BASE}/student-searched-subjects?subjectName=${encodeURIComponent(searchVal)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (!data) return;
                const subjects = data.subjects || [];

                const container = document.querySelector(".subjectCardContainer");
                if (!container) return;
                container.innerHTML = "";

                if (subjects.length === 0) {
                    container.innerHTML = `<p style='color: white; margin: 15px;'>No subjects available for Grade ${data.studentGrade || ''}.</p>`;
                    return;
                }

                subjects.forEach(subject => {
                    const card = document.createElement("div");
                    card.className = "subject_card";
                    card.setAttribute("data-subject-id", subject.subject_id);
                    card.style.cursor = "pointer";
                    card.innerHTML = `<strong>${escapeHtml(subject.subject_name)}</strong><br><small style="font-size: 13px; opacity: 0.85;">Code: ${escapeHtml(subject.subject_id)}</small>`;

                    card.addEventListener('click', () => {
                        const searchedSubjectContainer = document.getElementById("searchedSubjectContainer");
                        if (searchedSubjectContainer) searchedSubjectContainer.style.display = "flex";

                        const subjectNameSpan = document.getElementById("subjectNameSpan");
                        if (subjectNameSpan) subjectNameSpan.textContent = `${subject.subject_name} (${subject.subject_id})`;

                        const subjectCodeInput = document.getElementById("subjectCodeInput");
                        if (subjectCodeInput) subjectCodeInput.value = subject.subject_id;
                    });

                    container.appendChild(card);
                });
            })
            .catch(err => console.error("Error searching subjects:", err));

    } catch (e) {
        console.error("Error searching subjects:", e);
    }
}

async function enrollInSubject() {
  const input = document.getElementById("subjectCodeInput");
  const subjectCode = input ? input.value.trim() : null;

  if (!subjectCode) {
    alert("Please enter a subject code");
    return;
  }

  const token = localStorage.getItem("token");

  try {
    const response = await fetch(`${API_BASE}/api/enroll-subject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ subjectCode })
    });

    const data = await response.json(); 
    alert(data.message);
    if (data.success) {
        viewEnrolledSubjects();
        const searchedSubjectContainer = document.getElementById("searchedSubjectContainer");
        if (searchedSubjectContainer) searchedSubjectContainer.style.display = "none";
    }

  } catch (error) {
    console.error("Network Error:", error);
    alert("Check your connection or if the server is running.");
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
