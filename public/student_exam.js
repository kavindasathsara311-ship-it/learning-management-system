
const examScheduleCard = document.getElementById("examScheduleCard");
const viewResultsCard = document.getElementById("viewResultsCard");
const contactInstructorCard = document.getElementById("contactInstructorCard");
const examCardContainer = document.getElementById("examCardContainer");



examScheduleCard?.addEventListener('click', () => {
    alert("This feature is under development. Please check back later.");
    examScheduleCard.style.display = "none";
    viewResultsCard.style.display = "none";
    contactInstructorCard.style.display = "none";

    const examScheduleContent = document.createElement("div");
    examScheduleContent.className = "examScheduleContent";

    getExamSchedule();
});

viewResultsCard?.addEventListener('click', () => {
    window.location.href = 'student_exam_results.html';
});

contactInstructorCard?.addEventListener('click', () => {
    window.location.href = 'student_contact_instructor.html';
});

async function getExamSchedule() {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("No token found. Please login again.");
            window.location.href = "LoginPage.html";
            return;
        }

        const response = await fetch("http://localhost:3000/api/exam-schedule", { 
            method: "POST", // Must match your app.post in backend
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 403) alert("Access Denied: Students only.");
            throw new Error("Failed to fetch exam schedule");
        }

        const data = await response.json();
        console.log("Exam Schedule Received:", data.exam_schedule);

        // Logic to display the data:
        const container = document.getElementById("examCardContainer");
        container.innerHTML = ""; 

        data.exam_schedule.forEach(exam => {
            const div = document.createElement("div");
            div.className = "exam_card"; 
            
            const examDate = new Date(exam.date).toLocaleDateString();

            div.innerHTML = `
                <div class="exam_header">
                    <strong>Subject:</strong> ${exam.subject_name}
                </div>
                <div class="exam_details">
                    <p>📅 Date: ${examDate}</p>
                    <p>⏰ Time: ${exam.time}</p>
                </div>
            `;

            container.appendChild(div);
        });
        return data.exam_schedule;

    } catch (error) {
        console.error("Error fetching exam schedule:", error);
    }
}

function showResults() {
    alert("This feature is under development. Please check back later.");
}