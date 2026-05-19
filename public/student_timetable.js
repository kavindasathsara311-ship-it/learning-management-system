const timeTableContainer = document.getElementById("timeTablecardContainer");
const timeTablecardContainer = document.getElementById("timeTablecardContainer");

async function getTimeTable() {
    try{
        const token = localStorage.getItem("token");
        if (!token) {
            alert("No token found. Please login again.");
            window.location.href = "LoginPage.html";
            return;
        }

        const response = await fetch("http://localhost:3000/api/timeTable", { 
            method: "POST", 
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 403) alert("Access Denied: Students only.");
            throw new Error("Failed to fetch exam schedule");
        }
        console.log("Time Table Response:", response);
        const data = await response.json();
        console.log("Time Table Data:", data);

        const timeTableData = data.time_table; 
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
            const dayEntries = timeTableData.filter(entry => 
                entry.weekday.trim().toLowerCase() === day.toLowerCase()
            );

            tableHTML += `<td>`;
            if (dayEntries.length > 0) {
                dayEntries.forEach(item => {
                    tableHTML += `
                        <div class="timetable-entry">
                            <div class="subject">${item.subject_name}</div>
                            <div class="time">${item.starttime} - ${item.endtime}</div>
                        </div>
                    `;
                });
            } else {
                tableHTML += `<div class="no-class">No Classes</div>`;
            }
            tableHTML += `</td>`;
        });

        tableHTML += `</tr></tbody></table>`;

        const timeTableContainer = document.getElementById("timeTablecardContainer");
        timeTableContainer.innerHTML = tableHTML;
    } catch (error) {
        console.error("Error fetching time table:", error);
    }
}

getTimeTable();