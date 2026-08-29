// teacher_assignment.js - Teacher Assignment Management & Grading

let teacherAssignments = [];
let currentAssignmentId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadAssignments();
});

async function loadAssignments() {
    const token = localStorage.getItem("token");
    if (!token) {
        window.location.href = "LoginPage.html";
        return;
    }

    const container = document.getElementById("assignmentsTableContainer");
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/api/teacher-assignments`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success) {
            container.innerHTML = `<p style="color:#ef4444; padding: 20px;">Failed to load assignments.</p>`;
            return;
        }

        teacherAssignments = data.assignments || [];

        if (teacherAssignments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 50px 20px; background: rgba(255,255,255,0.05); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.2);">
                    <i class="fa fa-tasks" style="font-size: 40px; color: #94a3b8; margin-bottom: 12px;"></i>
                    <h3 style="margin: 0 0 8px 0; color: #fff;">No Assignments Created Yet</h3>
                    <p style="color: #94a3b8; margin: 0 0 15px 0;">You can create assignments directly inside any of your teaching classes.</p>
                    <a href="teacher_Class.html" style="display: inline-block; background: #00bcd4; color: white; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                        Go to Classes
                    </a>
                </div>
            `;
            return;
        }

        let html = `
            <table class="tableContainer" style="width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.2); border-radius: 10px; overflow: hidden; color: #fff;">
                <thead>
                    <tr style="background: rgba(255,255,255,0.12); text-align: left; font-size: 13px; text-transform: uppercase;">
                        <th style="padding: 14px 16px;">Subject</th>
                        <th style="padding: 14px 16px;">Assignment Title</th>
                        <th style="padding: 14px 16px;">Due Date</th>
                        <th style="padding: 14px 16px;">Max Marks</th>
                        <th style="padding: 14px 16px;">Submissions</th>
                        <th style="padding: 14px 16px; text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody>
        `;

        teacherAssignments.forEach(a => {
            const dueDateStr = new Date(a.due_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

            const ungradedBadge = a.ungraded_count > 0 
                ? `<span style="background: #f59e0b; color: #000; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 12px; margin-left: 6px;">${a.ungraded_count} Ungraded</span>` 
                : `<span style="background: #22c55e; color: #fff; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 12px; margin-left: 6px;">All Graded</span>`;

            html += `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <td style="padding: 14px 16px;"><strong>${escapeHtml(a.subject_name)}</strong></td>
                    <td style="padding: 14px 16px;">
                        <div style="font-weight: 600; color: #38bdf8;">${escapeHtml(a.title)}</div>
                        <small style="color: #94a3b8;">${escapeHtml((a.description || '').substring(0, 60))}</small>
                    </td>
                    <td style="padding: 14px 16px;">${dueDateStr}</td>
                    <td style="padding: 14px 16px;">${a.max_marks || 100}</td>
                    <td style="padding: 14px 16px;">
                        <span>${a.submission_count} Submitted</span>
                        ${ungradedBadge}
                    </td>
                    <td style="padding: 14px 16px; text-align: right;">
                        <button onclick="openGradingModal(${a.assignment_id}, '${escapeHtml(a.title)}', ${a.max_marks || 100})" 
                                style="background: #00bcd4; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer;">
                            <i class="fa fa-graduation-cap"></i> Review & Grade
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (err) {
        console.error("Error loading assignments:", err);
        container.innerHTML = `<p style="color:#ef4444; padding: 20px;">Failed to fetch assignments.</p>`;
    }
}

async function openGradingModal(assignmentId, title, maxMarks) {
    currentAssignmentId = assignmentId;
    const modal = document.getElementById("gradingModal");
    const modalTitle = document.getElementById("gradingModalTitle");
    const modalBody = document.getElementById("gradingModalBody");

    if (!modal || !modalBody) return;

    modalTitle.innerHTML = `<i class="fa fa-tasks" style="color: #38bdf8;"></i> Submissions for "${escapeHtml(title)}" (Max Marks: ${maxMarks})`;
    modalBody.innerHTML = `<p style="color: #64748b; text-align: center; padding: 30px;">Loading student submissions...</p>`;
    modal.style.display = "flex";

    const token = localStorage.getItem("token");
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/api/assignment-submissions/${assignmentId}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (!data.success || !data.submissions || data.submissions.length === 0) {
            modalBody.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #64748b;">
                    <i class="fa fa-clipboard-check" style="font-size: 40px; color: #cbd5e1; margin-bottom: 10px;"></i>
                    <h3 style="margin: 0 0 5px 0; color: #1e293b;">No Submissions Yet</h3>
                    <p style="margin: 0;">None of your enrolled students have submitted this assignment yet.</p>
                </div>
            `;
            return;
        }

        let subsHtml = `
            <div style="display: flex; flex-direction: column; gap: 15px;">
        `;

        data.submissions.forEach(sub => {
            const subDate = new Date(sub.submitted_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });
            const isGraded = sub.marks !== null && sub.marks !== undefined;
            const fullFileUrl = sub.file_url.startsWith("http") ? sub.file_url : `${API_BASE}${sub.file_url}`;

            subsHtml += `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; color: #0f172a;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <h4 style="margin: 0 0 4px 0; font-size: 16px; color: #1e293b;">${escapeHtml(sub.student_name)}</h4>
                            <span style="font-size: 13px; color: #64748b;">Reg No: ${escapeHtml(sub.student_reg_no)} &bull; Submitted: ${subDate}</span>
                        </div>
                        <a href="${fullFileUrl}" target="_blank" download style="background: #0284c7; color: white; text-decoration: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fa fa-file-arrow-down"></i> View Student File
                        </a>
                    </div>

                    <div style="display: flex; gap: 15px; align-items: flex-end; background: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1;">
                        <div style="flex: 1;">
                            <label style="display: block; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 4px;">Score (Out of ${maxMarks})</label>
                            <input type="number" id="marks_${sub.submission_id}" value="${isGraded ? sub.marks : ''}" placeholder="Marks" max="${maxMarks}" min="0" style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div style="flex: 3;">
                            <label style="display: block; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 4px;">Feedback / Remarks</label>
                            <input type="text" id="feedback_${sub.submission_id}" value="${escapeHtml(sub.feedback || '')}" placeholder="e.g. Well researched and detailed answer." style="width: 100%; padding: 8px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px;">
                        </div>
                        <div>
                            <button onclick="submitGrade(${sub.submission_id})" style="background: #22c55e; color: white; border: none; padding: 9px 18px; border-radius: 6px; font-weight: bold; cursor: pointer; height: 38px;">
                                <i class="fa fa-save"></i> Save Grade
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        subsHtml += `</div>`;
        modalBody.innerHTML = subsHtml;

    } catch (err) {
        console.error("Error loading submissions:", err);
        modalBody.innerHTML = `<p style="color:#ef4444; padding: 20px; text-align: center;">Failed to load submissions.</p>`;
    }
}

async function submitGrade(submissionId) {
    const marksInput = document.getElementById(`marks_${submissionId}`);
    const feedbackInput = document.getElementById(`feedback_${submissionId}`);

    if (!marksInput || marksInput.value === "") {
        alert("Please enter a numeric score.");
        return;
    }

    const marks = marksInput.value;
    const feedback = feedbackInput ? feedbackInput.value.trim() : "";
    const token = localStorage.getItem("token");

    try {
        const res = await fetch(`${API_BASE}/api/grade-submission`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ submission_id: submissionId, marks, feedback })
        });

        const data = await res.json();
        alert(data.message || "Grade submitted successfully!");
        if (data.success) {
            loadAssignments();
        }
    } catch (err) {
        console.error("Error submitting grade:", err);
        alert("Failed to submit grade.");
    }
}

function closeGradingModal() {
    const modal = document.getElementById("gradingModal");
    if (modal) modal.style.display = "none";
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
