const timeIcon = document.getElementById("timeIcon");
const dashboardContainer = document.getElementById("dashboardContainer");
const topNavBar = document.getElementById("topNavBar");
const body = document.getElementById("body");


document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "LoginPage.html";
        return;
    }

    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);

        // Display name based on the page
        const studentNameSpan = document.getElementById("studentName");
        const teacherNameSpan = document.getElementById("teacherName");

        if (studentNameSpan && payload.role === "student") {
            studentNameSpan.textContent = payload.name;
        } else if (teacherNameSpan && payload.role === "teacher") {
            teacherNameSpan.textContent = payload.name;
        }

        // Handle Log Out
        const logOutButtons = document.querySelectorAll(".logOutButton");
        logOutButtons.forEach(link => {
            link.addEventListener("click", () => {
                localStorage.removeItem("token");
                window.location.href = "LoginPage.html";
            });
            link.style.cursor = "pointer";
        });

    } catch (e) {
        console.error("Error decoding token:", e);
    }
});

const currentHours = new Date().getHours();
const greetingElement = document.getElementById("greeting");
const teacherGreetingElement = document.getElementById("teacherGreeting");

if (greetingElement) {
    let greetingText = "Hello";
    if (currentHours < 12) {
        greetingText = "Good Morning";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "gold";

    } else if (currentHours < 15) {
        greetingText = "Good Afternoon";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "orange";
        
    } else if (currentHours >= 15) {
        greetingText = "Good Evening";
        timeIcon.classList.remove("fa-sun");
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-cloud-moon");
        timeIcon.style.color = "rgb(252, 223, 6)";

    }
    greetingElement.textContent = greetingText;
} else if (teacherGreetingElement) {
    let greetingText = "Hello";   
    if (currentHours < 12) {
        greetingText = "Good Morning";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "gold";
        
    } else if (currentHours < 18) {
        greetingText = "Good Afternoon";
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-sun");
        timeIcon.classList.remove("fa-cloud-moon");
        timeIcon.style.color = "orange";
    } else if (currentHours >= 18) {
        greetingText = "Good Evening";
        timeIcon.classList.remove("fa-sun");
        timeIcon.classList.remove("fa-moon");
        timeIcon.classList.add("fa-cloud-moon");
        timeIcon.style.color = "yellow";
        
    }
    teacherGreetingElement.textContent = greetingText;
}
