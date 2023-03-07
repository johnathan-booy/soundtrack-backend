-- -- SKILL LEVELS
-- INSERT INTO skill_levels (name) VALUES
-- ('Beginner'),
-- ('Intermediate'),
-- ('Advanced');

-- -- TEACHERS
-- -- all passwords set to 'password'
-- INSERT INTO teachers (id, name, email, password, description, is_admin) VALUES
-- (1, 'John Doe', 'johndoe@example.com', 'password', 'Experienced piano teacher with over 10 years of teaching experience.', TRUE),
-- (2, 'Jane Smith', 'janesmith@example.com', 'password', 'Professional violinist and music teacher.', FALSE),
-- (3, 'David Lee', 'davidlee@example.com', 'password', 'Experienced guitar teacher and session musician.', FALSE);

-- -- STUDENTS
-- INSERT INTO students (name, email, description, skill_level_id, teacher_id) VALUES
-- ('Alice Johnson', 'alice@example.com', 'A 14-year-old beginner piano player who wants to learn classical music.', 1, 1),
-- ('Bob Lee', 'bob@example.com', 'A 27-year-old intermediate guitar player who wants to improve his fingerpicking technique.', 2, 3),
-- ('Catherine Kim', 'catherine@example.com', 'A 20-year-old advanced violinist who wants to prepare for a music competition.', 3, 2),
-- ('Daniel Park', 'daniel@example.com', 'A 10-year-old beginner violin player who is interested in learning different styles of music.', 1, 2),
-- ('Emily Chen', 'emily@example.com', 'A 15-year-old intermediate piano player who wants to learn jazz improvisation.', 2, 1),
-- ('Frank Brown', 'frank@example.com', 'A 25-year-old advanced guitar player who wants to learn how to write his own music.', 3, 3),
-- ('Grace Davis', 'grace@example.com', 'A 12-year-old beginner piano player who is interested in playing pop music.', 1, 1),
-- ('Henry Kim', 'henry@example.com', 'A 30-year-old intermediate violin player who wants to improve his bowing technique.', 2, 2),
-- ('Isabella Hernandez', 'isabella@example.com', 'A 17-year-old advanced piano player who wants to prepare for a music college audition.', 3, 1),
-- ('Jack Smith', 'jack@example.com', 'A 9-year-old beginner guitar player who wants to learn how to play his favorite songs.', 1, 3);

-- -- TECHNIQUES
-- INSERT INTO techniques (tonic, mode, type, description, skill_level_id, teacher_id) VALUES
-- ('C', 'Major', 'Scales', 'Practice major scales in C position.', 1, 1),
-- ('A', 'Minor', 'Scales', 'Practice natural minor scales in A position.', 2, 1),
-- ('G', 'Major', 'Chords', 'Learn to play G major chord in open position.', 1, 3),
-- ('D', 'Major', 'Chords', 'Learn to play D major chord in open position.', 2, 3),
-- ('E', 'Minor', 'Arpeggios', 'Practice E minor arpeggios in two octaves.', 3, 3),
-- ('B', 'Phrygian', 'Scales', 'Practice B Phrygian mode in first position.', 3, 2),
-- ('F#', 'Dorian', 'Scales', 'Practice F# Dorian mode in second position.', 2, 2),
-- ('A', 'Mixolydian', 'Scales', 'Practice A Mixolydian mode in fifth position.', 3, 1),
-- ('E', 'Major', 'Arpeggios', 'Practice E Major arpeggios in three octaves.', 2, 3);


-- -- REPERTOIRE
-- INSERT INTO repertoire (name, composer, arranger, genre, sheet_music_url, description, skill_level_id, teacher_id) VALUES
-- ('Für Elise', 'Ludwig van Beethoven', NULL, 'Classical', 'https://example.com/fur-elise.pdf', 'One of the most famous piano pieces composed by Beethoven.', 2, 1),
-- ('Canon in D', 'Johann Pachelbel', NULL, 'Classical', 'https://example.com/canon-in-d.pdf', 'A popular piece for weddings and other occasions.', 3, 2),
-- ('Hotel California', 'Eagles', NULL, 'Rock', 'https://example.com/hotel-california.pdf', 'A classic rock song with iconic guitar solos.', 2, 3),
-- ('Stairway to Heaven', 'Led Zeppelin', NULL, 'Rock', 'https://example.com/stairway-to-heaven.pdf', 'One of the greatest rock songs of all time.', 3, 3),
-- ('All of Me', 'John Legend', NULL, 'Pop', 'https://example.com/all-of-me.pdf', 'A romantic ballad with a catchy melody.', 2, 1);

-- -- STUDENT TECHNIQUES
-- INSERT INTO student_techniques (student_id, technique_id, completed_at, reviewed_at, review_interval) VALUES
-- (1, 1, NULL, NOW() - INTERVAL '1 Days', '1 week'),
-- (1, 2, NOW(), NOW(), '5 weeks'),
-- (2, 3, NULL, NULL, NULL),
-- (3, 5, '2022-01-10', '2022-01-20', '2 weeks'),
-- (4, 2, '2022-02-15', NULL, NULL),
-- (5, 1, '2022-01-20', NULL, NULL),
-- (1, 3, NOW(), NOW(), NULL);

-- -- STUDENT REPERTOIRE
-- INSERT INTO student_repertoire (student_id, repertoire_id, completed_at, reviewed_at, review_interval) VALUES
-- (1, 1, '2022-02-01', NULL, NULL),
-- (1, 3, '2022-02-15', '2022-02-20', '1 week'),
-- (2, 4, '2022-01-20', NULL, NULL),
-- (3, 2, '2022-02-10', NULL, NULL),
-- (4, 3, '2022-02-20', NULL, NULL),
-- (5, 5, '2022-01-25', NULL, NULL);

-- -- LESSONS
-- INSERT INTO lessons (student_id, teacher_id, date, notes) VALUES
-- (1, 1, NOW() - INTERVAL '1 Days', 'Reviewed scales and practiced Für Elise.'),
-- (2, 3, NOW() - INTERVAL '68 Days', 'Learned fingerpicking technique and practiced Hotel California.'),
-- (3, 2, NOW() - INTERVAL '5 Days', 'Reviewed Canon in D and worked on intonation.'),
-- (4, 2, NOW() - INTERVAL '12 Days', 'Learned vibrato technique and practiced A minor scales.'),
-- (5, 1, NOW() - INTERVAL '32 Days', 'Reviewed jazz improvisation and practiced All of Me.');

-- -- LESSON TECHNIQUES
-- INSERT INTO lesson_techniques (lesson_id, student_technique_id, rating) VALUES
-- (1, 1, 3),
-- (1, 2, 2),
-- (2, 3, 1),
-- (2, 6, 2),
-- (3, 4, 3),
-- (3, 5, 2),
-- (4, 2, 1),
-- (4, 6, 2),
-- (5, 1, 3),
-- (5, 5, 2);

-- -- LESSON REPERTOIRE
-- INSERT INTO lesson_repertoire (lesson_id, student_repertoire_id, completed, rating) VALUES
-- (1, 1, true, 3),
-- (1, 3, false, 2),
-- (2, 4, true, 1),
-- (2, 3, false, 2),
-- (3, 2, true, 3),
-- (3, 3, false, 1),
-- (4, 6, true, 2),
-- (5, 5, true, 3),
-- (5, 1, false, 2);