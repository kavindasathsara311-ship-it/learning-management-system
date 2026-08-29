// teacher_timetable.js - Weekly timetable for teachers

async function getTimetable() {
    const timetableCardContainer = document.querySelector('.timetableCardContainer');
    if (!timetableCardContainer) return;

    try {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "LoginPage.html";
            return;
        }

        const response = await fetch(`${API_BASE}/api/teacher-timetable`, { 
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        if (!response.ok) {
            if (response.status === 403) alert("Access Denied: Teachers only.");
            throw new Error("Failed to fetch timetable");
        }

        const data = await response.json();
        const timeTableData = data.timetable || [];
        const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        let tableHTML = `
            <table class="timetable-grid">
                <thead>
                    <tr>
                        ${daysOfWeek.map(day => `<th>${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
        `;

        daysOfWeek.forEach(day => {
            const dayEntries = timeTableData.filter(entry => {
                const dayVal = (entry.weekDay || entry.weekday || "").trim().toLowerCase();
                return dayVal === day.toLowerCase();
            });

            tableHTML += `<td>`;
            if (dayEntries.length > 0) {
                dayEntries.forEach(item => {
                    const start = item.startTime || item.starttime || "";
                    const end = item.endTime || item.endtime || "";
                    tableHTML += `
                        <div class="timetable-entry">
                            <div class="subject">${escapeHtml(item.subject_name)}</div>
                            <div class="time"><i class="fa fa-clock"></i> ${escapeHtml(start)} - ${escapeHtml(end)}</div>
                        </div>
                    `;
                });
            } else {
                tableHTML += `<div class="no-class">No Classes</div>`;
            }
            tableHTML += `</td>`;
        });

        tableHTML += `
                    </tr>
                </tbody>
            </table>
        `;

        timetableCardContainer.innerHTML = tableHTML;

    } catch (err) {
        console.error("Error loading teacher timetable:", err);
        timetableCardContainer.innerHTML = `<p style="color: #ef4444; padding: 20px;">Failed to load timetable.</p>`;
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

document.addEventListener("DOMContentLoaded", () => {
    getTimetable();
});