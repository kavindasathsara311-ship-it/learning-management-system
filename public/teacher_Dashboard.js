const classNavLink = document.getElementById('class');
const examNavLink = document.getElementById('exam');
const timeTableNavLink = document.getElementById('timeTable');
const assignmentNavLink = document.getElementById('assignment');
const attendenceNavLink = document.getElementById("attendence");
const notificationNavLink = document.getElementById('notification');
const dashboardNavLink = document.getElementById('dashboard');

dashboardNavLink?.addEventListener('click', () => {
    window.location.href = 'teacher_Dashboard.html';
});

classNavLink?.addEventListener('click', () => {
    window.location.href = 'teacher_Class.html';
});

examNavLink?.addEventListener('click', () => {
    window.location.href = 'teacher_Exam.html';
});

timeTableNavLink?.addEventListener('click', () => {
    window.location.href = 'teacher_Timetable.html';
});

assignmentNavLink?.addEventListener('click', () => {
    window.location.href = 'teacher_Assignment.html';
});

attendenceNavLink?.addEventListener('click',() =>{
    window.location.href = 'teacher_attendence.html';
});

notificationNavLink?.addEventListener('click', () => {
    window.location.href = 'teacher_Notification.html';
});

