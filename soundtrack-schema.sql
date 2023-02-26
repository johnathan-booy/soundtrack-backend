--
-- SKILL LEVELS
--
CREATE TABLE skill_levels (
    id serial PRIMARY KEY,
    name varchar NOT NULL UNIQUE
);

--
-- TEACHERS and STUDENTS
--
CREATE TABLE teachers (
  id varchar(36) DEFAULT gen_random_uuid() PRIMARY KEY,
  password TEXT NOT NULL,
  name varchar(50) NOT NULL,
  email varchar NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  description text,
  date_added timestamp DEFAULT NOW(),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE
);


CREATE TABLE students (
    id serial PRIMARY KEY,
    name varchar(50) NOT NULL,
    email varchar NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    description text,
    skill_level_id int,
    teacher_id varchar(36),
    FOREIGN KEY (skill_level_id) REFERENCES skill_levels (id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
);

--
-- TECHNIQUE and REPERTOIRE
--
CREATE TABLE techniques (
    id serial PRIMARY KEY,
    tonic varchar(2) NOT NULL,
    mode varchar NOT NULL,
    type VARCHAR NOT NULL,
    description text,
    date_added timestamp DEFAULT NOW(),
    skill_level_id int,
    teacher_id varchar(36),
    FOREIGN KEY (skill_level_id) REFERENCES skill_levels (id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
);

CREATE TABLE repertoire (
    id serial PRIMARY KEY,
    name text NOT NULL,
    composer varchar(50) NOT NULL,
    arranger varchar(50),
    genre varchar NOT NULL,
    sheet_music_url varchar CHECK (sheet_music_url ~* 'https:\/\/[^\s]+'),
    description text,
    date_added timestamp DEFAULT NOW(),
    skill_level_id int,
    teacher_id varchar(36),
    FOREIGN KEY (skill_level_id) REFERENCES skill_levels (id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
);

CREATE TABLE student_techniques (
    id serial PRIMARY KEY,
    student_id int NOT NULL,
    technique_id int NOT NULL,
    completed_at timestamp,
    reviewed_at timestamp,
    review_interval interval,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (technique_id) REFERENCES techniques (id) ON DELETE CASCADE
);

CREATE TABLE student_repertoire (
    id serial PRIMARY KEY,
    student_id int NOT NULL,
    repertoire_id int NOT NULL,
    completed_at timestamp,
    reviewed_at timestamp,
    review_interval interval,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (repertoire_id) REFERENCES repertoire (id) ON DELETE CASCADE
);

--
-- LESSONS
--
CREATE TABLE lessons (
    id serial PRIMARY KEY,
    student_id int NOT NULL,
    teacher_id varchar(36),
    date timestamp DEFAULT NOW(),
    notes text,
    FOREIGN KEY (student_id) REFERENCES students (id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers (id) ON DELETE SET NULL
);

CREATE TABLE lesson_techniques (
    id serial PRIMARY KEY,
    lesson_id int NOT NULL,
    student_technique_id int NOT NULL,
    rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 3),
    notes text,
    FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    FOREIGN KEY (student_technique_id) REFERENCES student_techniques (id) ON DELETE CASCADE
);

CREATE TABLE lesson_repertoire (
    id serial PRIMARY KEY,
    lesson_id int NOT NULL,
    student_repertoire_id int NOT NULL,
    completed boolean DEFAULT FALSE,
    rating integer DEFAULT 0 CHECK (rating >= 0 AND rating <= 3),
    notes text,
    FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE,
    FOREIGN KEY (student_repertoire_id) REFERENCES student_repertoire (id) ON DELETE CASCADE
);

