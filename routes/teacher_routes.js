const express = require("express");
const router = express.Router();
const pool = require("../db/db");

// POST – Add Teacher
router.post("/add-teacher", async (req, res) => {
  try {
    const { name, id, email, phone, password, teachingSubjects } = req.body;

    await pool.query(
      `INSERT INTO teacher
      (teacher_name, teacher_register_no, email, phone_number, password, teaching_subjects)
      VALUES ($1,$2,$3,$4,$5,$6)`,
      [name, id, email, phone, password, teachingSubjects]
    );

    res.status(201).send("Teacher added successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to add teacher");
  }
});

module.exports = router;
