--
-- PostgreSQL database dump
--

\restrict dhwPQPeXZ9tSU2CZy2wF4LGpKBYoFMwicNHuUh65T7RgCt7PxajmilNJVihUiO0

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: course_materials; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_materials (
    id integer NOT NULL,
    teacher_id bigint NOT NULL,
    subject_id character varying(8) NOT NULL,
    lesson_id integer,
    display_name character varying(255) NOT NULL,
    storage_key text NOT NULL,
    file_url text NOT NULL,
    mime_type character varying(100),
    file_size_bytes bigint,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_materials OWNER TO postgres;

--
-- Name: course_materials_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_materials_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_materials_id_seq OWNER TO postgres;

--
-- Name: course_materials_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_materials_id_seq OWNED BY public.course_materials.id;


--
-- Name: enrolled_subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrolled_subjects (
    student_id bigint NOT NULL,
    subject_id character varying(8) NOT NULL
);


ALTER TABLE public.enrolled_subjects OWNER TO postgres;

--
-- Name: enrolled_subjects_student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrolled_subjects_student_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrolled_subjects_student_id_seq OWNER TO postgres;

--
-- Name: enrolled_subjects_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrolled_subjects_student_id_seq OWNED BY public.enrolled_subjects.student_id;


--
-- Name: exam; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.exam (
    exam_id bigint NOT NULL,
    exam_name character varying(15),
    grade_id character varying(5)
);


ALTER TABLE public.exam OWNER TO postgres;

--
-- Name: exam_exam_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.exam_exam_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.exam_exam_id_seq OWNER TO postgres;

--
-- Name: exam_exam_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.exam_exam_id_seq OWNED BY public.exam.exam_id;


--
-- Name: grade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.grade (
    grade_id character varying(5) NOT NULL,
    grade_name character varying(20)
);


ALTER TABLE public.grade OWNER TO postgres;

--
-- Name: lesson; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson (
    lesson_id integer NOT NULL,
    lesson_name character varying(20),
    subject_id character varying(5),
    uploaded_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lesson OWNER TO postgres;

--
-- Name: lesson_lesson_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lesson_lesson_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lesson_lesson_id_seq OWNER TO postgres;

--
-- Name: lesson_lesson_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lesson_lesson_id_seq OWNED BY public.lesson.lesson_id;


--
-- Name: lesson_lesson_id_seq1; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.lesson ALTER COLUMN lesson_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.lesson_lesson_id_seq1
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    section_id character varying(5) NOT NULL,
    section_name character varying(20)
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- Name: student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student (
    student_id bigint NOT NULL,
    student_reg_no character varying(8) NOT NULL,
    student_name character varying(30) NOT NULL,
    email character varying(40) NOT NULL,
    phone_number character varying(10) NOT NULL,
    address character varying(40) NOT NULL,
    password text NOT NULL,
    grade_id character varying(6) NOT NULL
);


ALTER TABLE public.student OWNER TO postgres;

--
-- Name: student_student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_student_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_student_id_seq OWNER TO postgres;

--
-- Name: student_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_student_id_seq OWNED BY public.student.student_id;


--
-- Name: subject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subject (
    subject_id character varying(8) NOT NULL,
    subject_name character varying(20) NOT NULL,
    grade_id character varying(5)
);


ALTER TABLE public.subject OWNER TO postgres;

--
-- Name: subject_exam; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subject_exam (
    exam_id bigint NOT NULL,
    subject_id character varying(8) NOT NULL,
    date date,
    "time" time without time zone
);


ALTER TABLE public.subject_exam OWNER TO postgres;

--
-- Name: subject_exam_exam_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.subject_exam_exam_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.subject_exam_exam_id_seq OWNER TO postgres;

--
-- Name: subject_exam_exam_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.subject_exam_exam_id_seq OWNED BY public.subject_exam.exam_id;


--
-- Name: teacher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher (
    teacher_id bigint NOT NULL,
    teacher_reg_no character varying(8) NOT NULL,
    teacher_name character varying(30) NOT NULL,
    email character varying(30) NOT NULL,
    phone_number character varying(10) NOT NULL,
    password text NOT NULL
);


ALTER TABLE public.teacher OWNER TO postgres;

--
-- Name: teacher_grade; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_grade (
    grade_id character varying(8) NOT NULL,
    teacher_id integer NOT NULL
);


ALTER TABLE public.teacher_grade OWNER TO postgres;

--
-- Name: teacher_subject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_subject (
    teacher_id bigint NOT NULL,
    subject_id character varying(8) NOT NULL
);


ALTER TABLE public.teacher_subject OWNER TO postgres;

--
-- Name: teacher_subject_teacher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_subject_teacher_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teacher_subject_teacher_id_seq OWNER TO postgres;

--
-- Name: teacher_subject_teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_subject_teacher_id_seq OWNED BY public.teacher_subject.teacher_id;


--
-- Name: teacher_subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.teacher_subjects (
    teacher_id bigint NOT NULL,
    subject_id character varying(10) NOT NULL
);


ALTER TABLE public.teacher_subjects OWNER TO postgres;

--
-- Name: teacher_teacher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.teacher_teacher_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.teacher_teacher_id_seq OWNER TO postgres;

--
-- Name: teacher_teacher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.teacher_teacher_id_seq OWNED BY public.teacher.teacher_id;


--
-- Name: timetable; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timetable (
    timetable_id character varying(8) NOT NULL,
    timetable_name character varying(10),
    grade_id character varying(5)
);


ALTER TABLE public.timetable OWNER TO postgres;

--
-- Name: timetable_subject; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timetable_subject (
    timetable_id character varying(8) NOT NULL,
    subject_id character varying(8) NOT NULL,
    weekday character varying(10),
    starttime time without time zone,
    endtime time without time zone
);


ALTER TABLE public.timetable_subject OWNER TO postgres;

--
-- Name: course_materials id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials ALTER COLUMN id SET DEFAULT nextval('public.course_materials_id_seq'::regclass);


--
-- Name: enrolled_subjects student_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrolled_subjects ALTER COLUMN student_id SET DEFAULT nextval('public.enrolled_subjects_student_id_seq'::regclass);


--
-- Name: exam exam_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam ALTER COLUMN exam_id SET DEFAULT nextval('public.exam_exam_id_seq'::regclass);


--
-- Name: student student_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student ALTER COLUMN student_id SET DEFAULT nextval('public.student_student_id_seq'::regclass);


--
-- Name: subject_exam exam_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_exam ALTER COLUMN exam_id SET DEFAULT nextval('public.subject_exam_exam_id_seq'::regclass);


--
-- Name: teacher teacher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher ALTER COLUMN teacher_id SET DEFAULT nextval('public.teacher_teacher_id_seq'::regclass);


--
-- Name: teacher_subject teacher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject ALTER COLUMN teacher_id SET DEFAULT nextval('public.teacher_subject_teacher_id_seq'::regclass);


--
-- Data for Name: course_materials; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_materials (id, teacher_id, subject_id, lesson_id, display_name, storage_key, file_url, mime_type, file_size_bytes, created_at, updated_at) FROM stdin;
18	14	s901A	6	Matrix INTRO	1775480510920-570220768-IM-2023-091.pdf	/resources/lesson materials/1775480510920-570220768-IM-2023-091.pdf	application/pdf	1406599	2026-04-06 18:31:51.152388+05:30	2026-04-06 18:31:51.152388+05:30
19	14	s901A	7	graphs intro	1775549934801-207057149-Untitled document (9).pdf	/resources/lesson materials/1775549934801-207057149-Untitled document (9).pdf	application/pdf	65408	2026-04-07 13:48:54.992176+05:30	2026-04-07 13:48:54.992176+05:30
20	14	s901A	6	matrix Calculation	1775573145505-151009913-Untitled document (7).pdf	/resources/lesson materials/1775573145505-151009913-Untitled document (7).pdf	application/pdf	87841	2026-04-07 20:15:45.584147+05:30	2026-04-07 20:15:45.584147+05:30
21	14	s901A	6	matrix ending	1775642472017-464044544-Untitled document (10).pdf	/resources/lesson materials/1775642472017-464044544-Untitled document (10).pdf	application/pdf	60440	2026-04-08 15:31:12.139498+05:30	2026-04-08 15:31:12.139498+05:30
22	14	s901A	7	draw	1775651662163-447368836-Untitled Diagram.drawio.pdf	/resources/lesson materials/1775651662163-447368836-Untitled Diagram.drawio.pdf	application/pdf	51325	2026-04-08 18:04:22.219575+05:30	2026-04-08 18:04:22.219575+05:30
\.


--
-- Data for Name: enrolled_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrolled_subjects (student_id, subject_id) FROM stdin;
4	s601A
\.


--
-- Data for Name: exam; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.exam (exam_id, exam_name, grade_id) FROM stdin;
1	term	8C
\.


--
-- Data for Name: grade; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grade (grade_id, grade_name) FROM stdin;
1A	Grade 1 class A
1B	Grade 1 class B
1C	Grade 1 class C
2A	Grade 2 class A
2B	Grade 2 class B
2C	Grade 2 class C
3A	Grade 3 class A
3B	Grade 3 class B
3C	Grade 3 class C
4A	Grade 4 class A
4B	Grade 4 class B
4C	Grade 4 class C
5A	Grade 5 class A
5B	Grade 5 class B
5C	Grade 5 class C
6A	Grade 6 class A
6B	Grade 6 class B
6C	Grade 6 class C
7A	Grade 7 class A
7B	Grade 7 class B
7C	Grade 7 class C
8A	Grade 8 class A
8B	Grade 8 class B
8C	Grade 8 class C
9A	Grade 9 class A
9B	Grade 9 class B
9C	Grade 9 class C
10A	Grade 10 class A
10B	Grade 10 class B
10C	Grade 10 class C
11A	Grade 11 class A
11B	Grade 11 class B
11C	Grade 11 class C
12APS	Grade12class APhySci
12BBS	Grade12class BBioSci
12CAr	Grade12class CArts
12DCo	Grade12class D Com
12ET	Grade12class ETech
13APS	Grade13class APhySci
13BBS	Grade13class BBioSci
13CAr	Grade13classCArts
13DCo	Grade13class D Com
13ET	Grade13class E Tech
\.


--
-- Data for Name: lesson; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lesson (lesson_id, lesson_name, subject_id, uploaded_date) FROM stdin;
6	Matrix	s901A	2026-04-06 18:31:51.076676+05:30
7	Graphs	s901A	2026-04-07 13:48:54.905473+05:30
\.


--
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (section_id, section_name) FROM stdin;
6	section 6
7	section 7
8	section 8
9	section 9
10	section 10
11	section 11
12	section 12
13	section 13
\.


--
-- Data for Name: student; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.student (student_id, student_reg_no, student_name, email, phone_number, address, password, grade_id) FROM stdin;
1	10101	TestOTP	testotp@example.com	1234567890	123 St	$2b$10$IKtEMdRjd3g7oy7GJzOaZeiZLm/BitIJEzvR5jh4Ff7uz5cWnXaxa	10A
2	123	Kavinda Sathsara	kavindasathsara311@gmail.com	0712873043	Keppetipola	$2b$10$yj2GPFYJx6wI/pkwucY2kOW.9A9ZH7eFFIasanZtPbt7jZ5pKPLQ2	8C
3	123456	Kavinda Sathsara	kavindasathsara573@gmail.com	0712873043	Keppetipola	$2b$10$4oMASgkwpg2O82vo1hyYFe44/Z0LDPkqvaBGdSJ/XF/7/jLUB8Qw6	8C
4	10000	Kavinda Sathsara	kavindasathsara20031103@gmail.com	0712873043	Keppetipola	$2b$10$y0hFhzuUwccheHWUt4jhz.2AuAZ/XNwEkxXPFU8lyjhGWwvA1SBJ.	8C
6	REG0001	Anura	student1@school.com	0796004149	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
7	REG0002	Dilshan	student2@school.com	0792158192	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
8	REG0003	Kavindi	student3@school.com	0774564295	Colombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
9	REG0004	Dilshan	student4@school.com	0775534492	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
10	REG0005	Ruwan	student5@school.com	0722330451	Kandy	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
11	REG0006	Malith	student6@school.com	0717170277	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
12	REG0007	Dilshan	student7@school.com	0753189344	Colombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
13	REG0008	Anura	student8@school.com	0736193807	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
14	REG0009	Malith	student9@school.com	0745942406	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
15	REG0010	Priyanka	student10@school.com	0722059691	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
16	REG0011	Anura	student11@school.com	0770317040	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
17	REG0012	Nirosha	student12@school.com	0719685566	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
18	REG0013	Ruwan	student13@school.com	0717769227	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
19	REG0014	Priyanka	student14@school.com	0750941562	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
20	REG0015	Sajeewa	student15@school.com	0763348865	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
21	REG0016	Arjun	student16@school.com	0781000618	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
22	REG0017	Priyanka	student17@school.com	0734781102	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
23	REG0018	Tharindu	student18@school.com	0760704172	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
24	REG0019	Kavindi	student19@school.com	0772331407	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
25	REG0020	Kavindi	student20@school.com	0755698903	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
26	REG0021	Kamal	student21@school.com	0776550913	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
27	REG0022	Saman	student22@school.com	0796854310	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
28	REG0023	Priyanka	student23@school.com	0718396364	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
29	REG0024	Dilshan	student24@school.com	0721371379	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
30	REG0025	Sajeewa	student25@school.com	0734700675	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
31	REG0026	Sajeewa	student26@school.com	0723169199	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9B
32	REG0027	Priyanka	student27@school.com	0778282457	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
33	REG0028	Sajeewa	student28@school.com	0789587287	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
34	REG0029	Saman	student29@school.com	0736136989	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
35	REG0030	Malith	student30@school.com	0784072930	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
36	REG0031	Saman	student31@school.com	0766470106	Colombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
37	REG0032	Saman	student32@school.com	0787655464	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
38	REG0033	Nimal	student33@school.com	0767220702	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
39	REG0034	Saman	student34@school.com	0786206046	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9B
40	REG0035	Tharindu	student35@school.com	0728749144	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
41	REG0036	Nimal	student36@school.com	0731463291	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9B
42	REG0037	Saman	student37@school.com	0748740913	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
43	REG0038	Priyanka	student38@school.com	0752576196	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
44	REG0039	Nimal	student39@school.com	0740959267	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
45	REG0040	Tharindu	student40@school.com	0714422976	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
46	REG0041	Priyanka	student41@school.com	0754031506	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
47	REG0042	Dilshan	student42@school.com	0721054606	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
48	REG0043	Saman	student43@school.com	0758472768	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
49	REG0044	Saman	student44@school.com	0790819168	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
50	REG0045	Sajeewa	student45@school.com	0737062816	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
51	REG0046	Kamal	student46@school.com	0772329474	Kandy	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
52	REG0047	Arjun	student47@school.com	0789525544	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9B
53	REG0048	Anura	student48@school.com	0754257587	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
54	REG0049	Sajeewa	student49@school.com	0786667207	Kandy	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
55	REG0050	Kamal	student50@school.com	0759250815	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
56	REG0051	Nirosha	student51@school.com	0743301066	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
57	REG0052	Sajeewa	student52@school.com	0777552742	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
58	REG0053	Priyanka	student53@school.com	0783948120	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
59	REG0054	Kamal	student54@school.com	0713088323	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
60	REG0055	Arjun	student55@school.com	0764954111	Colombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
61	REG0056	Priyanka	student56@school.com	0723389525	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
62	REG0057	Anura	student57@school.com	0715049141	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
63	REG0058	Priyanka	student58@school.com	0756512996	Kandy	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
64	REG0059	Kamal	student59@school.com	0771151118	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
65	REG0060	Sunil	student60@school.com	0773411846	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
66	REG0061	Nimal	student61@school.com	0751245161	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
67	REG0062	Kamal	student62@school.com	0767505216	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
68	REG0063	Dilshan	student63@school.com	0769777175	Kandy	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
69	REG0064	Malith	student64@school.com	0754947876	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
70	REG0065	Ruwan	student65@school.com	0786886222	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
71	REG0066	Kamal	student66@school.com	0738014500	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
72	REG0067	Nimal	student67@school.com	0718343426	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9B
73	REG0068	Kavindi	student68@school.com	0762826640	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
74	REG0069	Kavindi	student69@school.com	0723607238	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9B
75	REG0070	Tharindu	student70@school.com	0777302127	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
76	REG0071	Kamal	student71@school.com	0745024861	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
77	REG0072	Tharindu	student72@school.com	0798466477	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
78	REG0073	Sunil	student73@school.com	0765001848	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
79	REG0074	Kamal	student74@school.com	0751533538	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
80	REG0075	Arjun	student75@school.com	0760958905	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
81	REG0076	Kamal	student76@school.com	0722352140	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10C
82	REG0077	Priyanka	student77@school.com	0792514395	Gampaha	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
83	REG0078	Nirosha	student78@school.com	0711922891	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
84	REG0079	Tharindu	student79@school.com	0796281737	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
85	REG0080	Anura	student80@school.com	0713914787	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
86	REG0081	Tharindu	student81@school.com	0798161565	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
87	REG0082	Kamal	student82@school.com	0731567038	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
88	REG0083	Malith	student83@school.com	0753465473	Galle	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
89	REG0084	Kavindi	student84@school.com	0779459874	Colombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
90	REG0085	Malith	student85@school.com	0768966648	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9C
91	REG0086	Dilshan	student86@school.com	0733559317	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
92	REG0087	Dilshan	student87@school.com	0781873989	Ratnapura	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
93	REG0088	Arjun	student88@school.com	0742063863	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
94	REG0089	Nirosha	student89@school.com	0783680391	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
95	REG0090	Dilshan	student90@school.com	0759085815	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
96	REG0091	Sunil	student91@school.com	0750738150	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9B
97	REG0092	Malith	student92@school.com	0742999420	Negombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
98	REG0093	Saman	student93@school.com	0770097816	Colombo	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
99	REG0094	Ishara	student94@school.com	0734437906	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
100	REG0095	Sajeewa	student95@school.com	0734610109	Jaffna	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8C
101	REG0096	Tharindu	student96@school.com	0744340609	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8B
102	REG0097	Ishara	student97@school.com	0756810854	Kandy	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10A
103	REG0098	Ruwan	student98@school.com	0788427781	Matara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	9A
104	REG0099	Dilshan	student99@school.com	0788992820	Kalutara	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	10B
105	REG0100	Saman	student100@school.com	0753025888	Kandy	$2a$12$R9h/cIPz0gi.URQHeNHGaOTZyMiGGQyBMvSLmBAuRYuyonMWuEn82	8A
\.


--
-- Data for Name: subject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subject (subject_id, subject_name, grade_id) FROM stdin;
s601A	Maths	6A
s602A	Sinhala	6A
s603A	Science	6A
s604A	History	6A
s605A	English	6A
s606A	Buddhism	6A
s607A	Christian	6A
s608A	Tamil	6A
s609A	Geography	6A
s610A	Civil Edu	6A
s611A	Health Edu	6A
s612A	ICT	6A
s613A	Arts	6A
s614A	Music	6A
s615A	Drama	6A
s616A	Practical	6A
s601B	Maths	6B
s602B	Sinhala	6B
s603B	Science	6B
s604B	History	6B
s605B	English	6B
s606B	Buddhism	6B
s607B	Christian	6B
s608B	Tamil	6B
s609B	Geography	6B
s610B	Civil Edu	6B
s611B	Health Edu	6B
s612B	ICT	6B
s613B	Arts	6B
s614B	Music	6B
s615B	Drama	6B
s616B	Practical	6B
s601C	Maths	6C
s602C	Sinhala	6C
s603C	Science	6C
s604C	History	6C
s605C	English	6C
s606C	Buddhism	6C
s607C	Christian	6C
s608C	Tamil	6C
s609C	Geography	6C
s610C	Civil Edu	6C
s611C	Health Edu	6C
s612C	ICT	6C
s613C	Arts	6C
s614C	Music	6C
s615C	Drama	6C
s616C	Practical	6C
s701A	Maths	7A
s702A	Sinhala	7A
s703A	Science	7A
s704A	History	7A
s705A	English	7A
s706A	Buddhism	7A
s707A	Christian	7A
s708A	Tamil	7A
s709A	Geography	7A
s710A	Civil Edu	7A
s711A	Health Edu	7A
s712A	ICT	7A
s713A	Arts	7A
s714A	Music	7A
s715A	Drama	7A
s716A	Practical	7A
s701B	Maths	7B
s702B	Sinhala	7B
s703B	Science	7B
s704B	History	7B
s705B	English	7B
s706B	Buddhism	7B
s707B	Christian	7B
s708B	Tamil	7B
s709B	Geography	7B
s710B	Civil Edu	7B
s711B	Health Edu	7B
s712B	ICT	7B
s713B	Arts	7B
s714B	Music	7B
s715B	Drama	7B
s716B	Practical	7B
s701C	Maths	7C
s702C	Sinhala	7C
s703C	Science	7C
s704C	History	7C
s705C	English	7C
s706C	Buddhism	7C
s707C	Christian	7C
s708C	Tamil	7C
s709C	Geography	7C
s710C	Civil Edu	7C
s711C	Health Edu	7C
s712C	ICT	7C
s713C	Arts	7C
s714C	Music	7C
s715C	Drama	7C
s716C	Practical	7C
s801A	Maths	8A
s802A	Sinhala	8A
s803A	Science	8A
s804A	History	8A
s805A	English	8A
s806A	Buddhism	8A
s807A	Christian	8A
s808A	Tamil	8A
s809A	Geography	8A
s810A	Civil Edu	8A
s811A	Health Edu	8A
s812A	ICT	8A
s813A	Arts	8A
s814A	Music	8A
s815A	Drama	8A
s816A	Practical	8A
s801B	Maths	8B
s802B	Sinhala	8B
s803B	Science	8B
s804B	History	8B
s805B	English	8B
s806B	Buddhism	8B
s807B	Christian	8B
s808B	Tamil	8B
s809B	Geography	8B
s810B	Civil Edu	8B
s811B	Health Edu	8B
s812B	ICT	8B
s813B	Arts	8B
s814B	Music	8B
s815B	Drama	8B
s816B	Practical	8B
s801C	Maths	8C
s802C	Sinhala	8C
s803C	Science	8C
s804C	History	8C
s805C	English	8C
s806C	Buddhism	8C
s807C	Christian	8C
s808C	Tamil	8C
s809C	Geography	8C
s810C	Civil Edu	8C
s811C	Health Edu	8C
s812C	ICT	8C
s813C	Arts	8C
s814C	Music	8C
s815C	Drama	8C
s816C	Practical	8C
s901A	Maths	9A
s902A	Sinhala	9A
s903A	Science	9A
s904A	History	9A
s905A	English	9A
s906A	Buddhism	9A
s907A	Christian	9A
s908A	Tamil	9A
s909A	Geography	9A
s910A	Civil Edu	9A
s911A	Health Edu	9A
s912A	ICT	9A
s913A	Arts	9A
s914A	Music	9A
s915A	Drama	9A
s916A	Practical	9A
s901B	Maths	9B
s902B	Sinhala	9B
s903B	Science	9B
s904B	History	9B
s905B	English	9B
s906B	Buddhism	9B
s907B	Christian	9B
s908B	Tamil	9B
s909B	Geography	9B
s910B	Civil Edu	9B
s911B	Health Edu	9B
s912B	ICT	9B
s913B	Arts	9B
s914B	Music	9B
s915B	Drama	9B
s916B	Practical	9B
s901C	Maths	9C
s902C	Sinhala	9C
s903C	Science	9C
s904C	History	9C
s905C	English	9C
s906C	Buddhism	9C
s907C	Christian	9C
s908C	Tamil	9C
s909C	Geography	9C
s910C	Civil Edu	9C
s911C	Health Edu	9C
s912C	ICT	9C
s913C	Arts	9C
s914C	Music	9C
s915C	Drama	9C
s916C	Practical	9C
s1001A	Maths	10A
s1002A	Sinhala	10A
s1003A	Science	10A
s1004A	History	10A
s1005A	English	10A
s1006A	Buddhism	10A
s1007A	Christian	10A
s1008A	Tamil	10A
s1009A	Geography	10A
s1010A	Civil Edu	10A
s1011A	Health Edu	10A
s1012A	ICT	10A
s1013A	Arts	10A
s1014A	Music	10A
s1015A	Drama	10A
s1016A	Practical	10A
s1001B	Maths	10B
s1002B	Sinhala	10B
s1003B	Science	10B
s1004B	History	10B
s1005B	English	10B
s1006B	Buddhism	10B
s1007B	Christian	10B
s1008B	Tamil	10B
s1009B	Geography	10B
s1010B	Civil Edu	10B
s1011B	Health Edu	10B
s1012B	ICT	10B
s1013B	Arts	10B
s1014B	Music	10B
s1015B	Drama	10B
s1016B	Practical	10B
s1001C	Maths	10C
s1002C	Sinhala	10C
s1003C	Science	10C
s1004C	History	10C
s1005C	English	10C
s1006C	Buddhism	10C
s1007C	Christian	10C
s1008C	Tamil	10C
s1009C	Geography	10C
s1010C	Civil Edu	10C
s1011C	Health Edu	10C
s1012C	ICT	10C
s1013C	Arts	10C
s1014C	Music	10C
s1015C	Drama	10C
s1016C	Practical	10C
s1101A	Maths	11A
s1102A	Sinhala	11A
s1103A	Science	11A
s1104A	History	11A
s1105A	English	11A
s1106A	Buddhism	11A
s1107A	Christian	11A
s1108A	Tamil	11A
s1109A	Geography	11A
s1110A	Civil Edu	11A
s1111A	Health Edu	11A
s1112A	ICT	11A
s1113A	Arts	11A
s1114A	Music	11A
s1115A	Drama	11A
s1116A	Practical	11A
s1101B	Maths	11B
s1102B	Sinhala	11B
s1103B	Science	11B
s1104B	History	11B
s1105B	English	11B
s1106B	Buddhism	11B
s1107B	Christian	11B
s1108B	Tamil	11B
s1109B	Geography	11B
s1110B	Civil Edu	11B
s1111B	Health Edu	11B
s1112B	ICT	11B
s1113B	Arts	11B
s1114B	Music	11B
s1115B	Drama	11B
s1116B	Practical	11B
s1101C	Maths	11C
s1102C	Sinhala	11C
s1103C	Science	11C
s1104C	History	11C
s1105C	English	11C
s1106C	Buddhism	11C
s1107C	Christian	11C
s1108C	Tamil	11C
s1109C	Geography	11C
s1110C	Civil Edu	11C
s1111C	Health Edu	11C
s1112C	ICT	11C
s1113C	Arts	11C
s1114C	Music	11C
s1115C	Drama	11C
s1116C	Practical	11C
s1201	Physics	12APS
s1202	Chemistry	12APS
s1203	Combined Maths	12APS
s1204	ICT	12APS
s1205	English	12APS
s1211	Biology	12BBS
s1212	Chemistry	12BBS
s1213	Physics	12BBS
s1214	Agriculture	12BBS
s1215	English	12BBS
s1231	Accounting	12CAr
s1232	Business Studies	12CAr
s1233	Economics	12CAr
s1234	ICT	12CAr
s1235	English	12CAr
s1241	ICT	12DCo
s1242	Eng Tech	12DCo
s1243	Bio Tech	12DCo
s1244	SFT	12DCo
s1245	Agriculture	12DCo
s1246	English	12DCo
s1251	ICT	12ET
s1252	Eng Tech	12ET
s1253	Bio Tech	12ET
s1254	SFT	12ET
s1255	Agriculture	12ET
s1256	English	12ET
s1301	Physics	13APS
s1302	Chemistry	13APS
s1303	Combined Maths	13APS
s1304	ICT	13APS
s1305	English	13APS
s1311	Biology	13BBS
s1312	Chemistry	13BBS
s1313	Physics	13BBS
s1314	Agriculture	13BBS
s1315	English	13BBS
s1331	Accounting	13CAr
s1332	Business Studies	13CAr
s1333	Economics	13CAr
s1334	ICT	13CAr
s1335	English	13CAr
s1341	ICT	13DCo
s1342	EngTech	13DCo
s1343	Bio Tech	13DCo
s1344	SFT	13DCo
s1345	Agriculture	13DCo
s1346	English	13DCo
s1351	ICT	13ET
s1352	EngTech	13ET
s1353	Bio Tech	13ET
s1354	SFT	13ET
s1355	Agriculture	13ET
s1356	English	13ET
\.


--
-- Data for Name: subject_exam; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.subject_exam (exam_id, subject_id, date, "time") FROM stdin;
1	s801C	2026-01-01	04:00:00
1	s802C	2026-01-02	04:00:00
1	s803C	2026-01-03	01:00:00
1	s804C	2026-01-04	08:00:00
1	s805C	2026-01-04	01:00:00
1	s806C	2026-01-05	12:00:00
1	s807C	2026-01-08	02:00:00
\.


--
-- Data for Name: teacher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher (teacher_id, teacher_reg_no, teacher_name, email, phone_number, password) FROM stdin;
14	753951	yasith mavinda	kavindasathsara320@gmail.com	0712873043	$2b$10$2L69LyrXoRhd0RrTyIBKtO4V/VZH5o.nsB9TEq3cAJUW/G/OGzrLa
15	T1001	Test Teacher	testteacher@example.com	1234567890	$2b$10$v/oHg61t9.sjIskNxCWoOu0/MDs5haYS/MG7.kt8Juu/UeeFGZB.S
\.


--
-- Data for Name: teacher_grade; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_grade (grade_id, teacher_id) FROM stdin;
\.


--
-- Data for Name: teacher_subject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_subject (teacher_id, subject_id) FROM stdin;
\.


--
-- Data for Name: teacher_subjects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.teacher_subjects (teacher_id, subject_id) FROM stdin;
14	s801C
14	s901A
15	s601A
14	s702A
14	s602C
14	s1002A
14	s1012C
\.


--
-- Data for Name: timetable; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.timetable (timetable_id, timetable_name, grade_id) FROM stdin;
t061	grade6A	6A
t081	grade8C	8C
t082	grade8A	8A
\.


--
-- Data for Name: timetable_subject; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.timetable_subject (timetable_id, subject_id, weekday, starttime, endtime) FROM stdin;
t081	s801C	Monday	07:50:00	08:30:00
t081	s802C	Teusday	08:30:00	09:10:00
t081	s803C	Wednsday	09:10:00	09:50:00
t081	s804C	thursday	09:50:00	10:30:00
\.


--
-- Name: course_materials_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_materials_id_seq', 22, true);


--
-- Name: enrolled_subjects_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrolled_subjects_student_id_seq', 1, false);


--
-- Name: exam_exam_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.exam_exam_id_seq', 1, false);


--
-- Name: lesson_lesson_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lesson_lesson_id_seq', 1, false);


--
-- Name: lesson_lesson_id_seq1; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lesson_lesson_id_seq1', 7, true);


--
-- Name: student_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.student_student_id_seq', 105, true);


--
-- Name: subject_exam_exam_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.subject_exam_exam_id_seq', 1, false);


--
-- Name: teacher_subject_teacher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_subject_teacher_id_seq', 1, false);


--
-- Name: teacher_teacher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.teacher_teacher_id_seq', 17, true);


--
-- Name: course_materials course_materials_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_pkey PRIMARY KEY (id);


--
-- Name: enrolled_subjects enrolled_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrolled_subjects
    ADD CONSTRAINT enrolled_subjects_pkey PRIMARY KEY (student_id, subject_id);


--
-- Name: exam exam_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam
    ADD CONSTRAINT exam_pkey PRIMARY KEY (exam_id);


--
-- Name: grade grade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.grade
    ADD CONSTRAINT grade_pkey PRIMARY KEY (grade_id);


--
-- Name: lesson lesson_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson
    ADD CONSTRAINT lesson_pkey PRIMARY KEY (lesson_id);


--
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (section_id);


--
-- Name: student student_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_email_key UNIQUE (email);


--
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (student_id);


--
-- Name: student student_student_reg_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_student_reg_no_key UNIQUE (student_reg_no);


--
-- Name: subject_exam subject_exam_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_exam
    ADD CONSTRAINT subject_exam_pkey PRIMARY KEY (subject_id, exam_id);


--
-- Name: subject subject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT subject_pkey PRIMARY KEY (subject_id);


--
-- Name: teacher teacher_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_email_key UNIQUE (email);


--
-- Name: teacher_grade teacher_grade_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_grade
    ADD CONSTRAINT teacher_grade_pkey PRIMARY KEY (grade_id, teacher_id);


--
-- Name: teacher teacher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_pkey PRIMARY KEY (teacher_id);


--
-- Name: teacher_subject teacher_subject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject
    ADD CONSTRAINT teacher_subject_pkey PRIMARY KEY (teacher_id, subject_id);


--
-- Name: teacher_subjects teacher_subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_pkey PRIMARY KEY (teacher_id, subject_id);


--
-- Name: teacher teacher_teacher_reg_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher
    ADD CONSTRAINT teacher_teacher_reg_no_key UNIQUE (teacher_reg_no);


--
-- Name: timetable timetable_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable
    ADD CONSTRAINT timetable_pkey PRIMARY KEY (timetable_id);


--
-- Name: timetable_subject timetable_subject_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable_subject
    ADD CONSTRAINT timetable_subject_pkey PRIMARY KEY (timetable_id, subject_id);


--
-- Name: course_materials course_materials_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lesson(lesson_id);


--
-- Name: course_materials course_materials_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(subject_id);


--
-- Name: course_materials course_materials_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_materials
    ADD CONSTRAINT course_materials_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teacher(teacher_id);


--
-- Name: enrolled_subjects enrolled_subjects_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrolled_subjects
    ADD CONSTRAINT enrolled_subjects_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(student_id);


--
-- Name: enrolled_subjects enrolled_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrolled_subjects
    ADD CONSTRAINT enrolled_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(subject_id);


--
-- Name: exam exam_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exam
    ADD CONSTRAINT exam_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grade(grade_id);


--
-- Name: subject fk_subject_grade; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject
    ADD CONSTRAINT fk_subject_grade FOREIGN KEY (grade_id) REFERENCES public.grade(grade_id) ON DELETE CASCADE;


--
-- Name: lesson lesson_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson
    ADD CONSTRAINT lesson_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(subject_id);


--
-- Name: student student_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grade(grade_id);


--
-- Name: subject_exam subject_exam_exam_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_exam
    ADD CONSTRAINT subject_exam_exam_id_fkey FOREIGN KEY (exam_id) REFERENCES public.exam(exam_id);


--
-- Name: subject_exam subject_exam_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_exam
    ADD CONSTRAINT subject_exam_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(subject_id);


--
-- Name: teacher_grade teacher_grade_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_grade
    ADD CONSTRAINT teacher_grade_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grade(grade_id);


--
-- Name: teacher_grade teacher_grade_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_grade
    ADD CONSTRAINT teacher_grade_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teacher(teacher_id);


--
-- Name: teacher_subject teacher_subject_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject
    ADD CONSTRAINT teacher_subject_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(subject_id);


--
-- Name: teacher_subject teacher_subject_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subject
    ADD CONSTRAINT teacher_subject_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teacher(teacher_id);


--
-- Name: teacher_subjects teacher_subjects_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(subject_id) ON DELETE CASCADE;


--
-- Name: teacher_subjects teacher_subjects_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.teacher_subjects
    ADD CONSTRAINT teacher_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teacher(teacher_id) ON DELETE CASCADE;


--
-- Name: timetable timetable_grade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable
    ADD CONSTRAINT timetable_grade_id_fkey FOREIGN KEY (grade_id) REFERENCES public.grade(grade_id);


--
-- Name: timetable_subject timetable_subject_subject_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable_subject
    ADD CONSTRAINT timetable_subject_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subject(subject_id);


--
-- Name: timetable_subject timetable_subject_timetable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timetable_subject
    ADD CONSTRAINT timetable_subject_timetable_id_fkey FOREIGN KEY (timetable_id) REFERENCES public.timetable(timetable_id);


--
-- Part 2 Schema Additions
--

CREATE TABLE IF NOT EXISTS public.attendance (
    attendance_id bigserial PRIMARY KEY,
    student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    subject_id character varying(8) NOT NULL REFERENCES subject(subject_id) ON DELETE CASCADE,
    date date NOT NULL,
    status character varying(10) NOT NULL CHECK (status IN ('Present','Absent','Late')),
    marked_by bigint REFERENCES teacher(teacher_id),
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, subject_id, date)
);

CREATE TABLE IF NOT EXISTS public.announcement (
    announcement_id bigserial PRIMARY KEY,
    title character varying(100) NOT NULL,
    message text NOT NULL,
    subject_id character varying(8) REFERENCES subject(subject_id) ON DELETE CASCADE,
    grade_id character varying(5) REFERENCES grade(grade_id) ON DELETE CASCADE,
    created_by bigint REFERENCES teacher(teacher_id),
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.announcement_read (
    announcement_id bigint NOT NULL REFERENCES announcement(announcement_id) ON DELETE CASCADE,
    student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    read_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (announcement_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.assignment (
    assignment_id bigserial PRIMARY KEY,
    subject_id character varying(8) NOT NULL REFERENCES subject(subject_id) ON DELETE CASCADE,
    teacher_id bigint NOT NULL REFERENCES teacher(teacher_id),
    title character varying(100) NOT NULL,
    description text,
    due_date timestamptz NOT NULL,
    max_marks integer NOT NULL DEFAULT 100,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.submission (
    submission_id bigserial PRIMARY KEY,
    assignment_id bigint NOT NULL REFERENCES assignment(assignment_id) ON DELETE CASCADE,
    student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    file_url text,
    submitted_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    marks integer,
    feedback text,
    graded_at timestamptz,
    UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.result (
    result_id bigserial PRIMARY KEY,
    exam_id bigint NOT NULL REFERENCES exam(exam_id) ON DELETE CASCADE,
    subject_id character varying(8) NOT NULL REFERENCES subject(subject_id) ON DELETE CASCADE,
    student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    marks_obtained numeric(5,2) NOT NULL,
    max_marks numeric(5,2) NOT NULL DEFAULT 100,
    grade character varying(3),
    published_at timestamptz DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, subject_id, student_id)
);

--
-- PostgreSQL database dump complete
--
