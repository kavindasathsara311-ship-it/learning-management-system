const subjectNavLink = document.getElementById('subjectNavLink');
const examsNavLink = document.getElementById('examsNavLink');
const timeTableNavLink = document.getElementById('timeTableNavLink');
const attendanceNavLink = document.getElementById('attendanceNavLink');
const notificationNavLink = document.getElementById('notificationNavLink');
const dashboardNavLink = document.getElementById('dashboardNavLink');


dashboardNavLink?.addEventListener('click', () => {
    window.location.href = 'Student_Dashboard.html';
});

subjectNavLink?.addEventListener('click', () => {
    window.location.href = 'student_subject.html';
});

examsNavLink?.addEventListener('click', () => {
    window.location.href = 'student_exam.html';
});

timeTableNavLink?.addEventListener('click', () => {
    window.location.href = 'student_timetable.html';
});

attendanceNavLink?.addEventListener('click', () => {
    window.location.href = 'student_Attendence.html';
});

notificationNavLink?.addEventListener('click', () => {
    window.location.href = 'student_notification.html';
});

function viewEnrolledSubjects() {
    try {
        const token = localStorage.getItem("token");

        if (!token) {
            console.error("Token not found");
            return;
        }

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);

        if (payload.role !== "student") return;

        fetch('http://localhost:3000/student-subjects', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                const subjects = data.enrolled_subjects;
                console.log("Fetched subjects:", subjects);

                const container = document.querySelector(".subjectCardContainer");
                container.innerHTML = "";

                subjects.forEach(subject => {
                    const card = document.createElement("div");
                    card.className = "subject_card";
                    card.textContent = subject.subject_name;
                    container.appendChild(card);
                });
            })
            .catch(err => console.error("Error fetching subjects:", err));

    } catch (e) {
        console.error("Error decoding token:", e);
    }
}

function searchSubjects() {
    const input = document.getElementById("subjectSearchInput");

    if (!input.value || input.value.trim() === "" || input.value.length < 1 || input.value.length > 10)
        alert("Please enter a valid subject name (1-10 characters).");
    else {
        try {

            const token = localStorage.getItem("token");

            if (!token) {
                console.error("Token not found");
                return;
            }
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );

            const payload = JSON.parse(jsonPayload);

            if (payload.role !== "student") return;
            fetch(`http://localhost:3000/student-searched-subjects?subjectName=${input.value}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then(res => {
                    if (!res.ok) {
                        if (res.status === 401 || res.status === 403) {
                            alert("Session expired. Please login again.");
                            window.location.href = "LoginPage.html";
                            return null;
                        }
                        throw new Error("Request failed with status " + res.status);
                    }
                    return res.json();
                })
                .then(data => {
                    if (!data) return;
                    const subjects = data.subjects || [];
                    console.log("Fetched searched subjects:", subjects);

                    const container = document.querySelector(".subjectCardContainer");
                    container.innerHTML = "";
                    subjects.forEach(subject => {
                        const card = document.createElement("div");
                        card.className = "subject_card";
                        card.id = "subject_card";
                        card.textContent = subject.subject_name;
                        container.appendChild(card);
                    });

                    const subjectCard = document.getElementById("subject_card");
                    subjectCard?.addEventListener('click', () => {

                        const searchedSubjectContainer = document.getElementById("searchedSubjectContainer");
                        searchedSubjectContainer.style.display = "flex";

                        const submitButton = document.getElementById("submitButton");

                        submitButton?.addEventListener('click', () => {
                            const enteredCode = card.value;
                            if (!enteredCode || enteredCode.trim() === "") {
                                alert("Please enter the subject code.");
                                return;
                            } else {
                                fetch(`http://localhost:3000/verify-subject-code?subjectId=${enteredCode}`, {
                                    headers: {
                                        'Authorization': `Bearer ${token}`
                                    }
                                })
                                    .then(res => {
                                        if (!res.ok) {
                                            if (res.status === 401 || res.status === 403) {
                                                alert("Session expired. Please login again.");
                                                window.location.href = "LoginPage.html";
                                                return null;
                                            }
                                            throw new Error("Request failed with status " + res.status);
                                        }
                                        return res.json();
                                    })
                                    .then(data => {
                                        if (!data) return;
                                        console.log("Subject details:", data);
                                        // Handle subject details display logic here
                                    })
                                    .catch(err => console.error("Error fetching subject details:", err));
                            }
                        });

                    });
                })
                .catch(err => console.error("Error fetching searched subjects:", err));

        } catch (e) {
            console.error("Error decoding token:", e);
        }
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
    const response = await fetch("http://localhost:3000/api/enroll-subject", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({ subjectCode })
    });

    // CHECK IF RESPONSE IS OK FIRST
    if (!response.ok) {
       try {
         const data = await response.json(); 
         console.error("Server Error:", data);
         alert(data.message || "Failed to enroll.");
       } catch (e) {
         console.error("Server Error (Text):", await response.text());
         alert("Server error: Could not enroll. Check console for details.");
       }
       return;
    }

    const data = await response.json(); 
    alert(data.message);

  } catch (error) {
    console.error("Network Error:", error);
    alert("Check your connection or if the server is running.");
  }
}

