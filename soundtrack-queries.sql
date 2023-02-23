-- Get all students and their teachers
SELECT s.name as student_name, t.name as teacher_name
FROM students s
JOIN teachers t ON s.teacher_id = t.id;

-- Get all techniques taught by a specific teacher
SELECT *
FROM techniques
WHERE teacher_id = 3;

-- Get all students who have completed a specific repertoire piece
SELECT s.name as student_name, r.name as repertoire_name, sr.completed_at
FROM students s
JOIN student_repertoire sr ON s.id = sr.student_id
JOIN repertoire r ON sr.repertoire_id = r.id
WHERE r.name = 'Hotel California' AND sr.completed_at IS NOT NULL;

-- Get the average rating for all techniques taught by a specific teacher
SELECT AVG(lt.rating) as avg_rating, t.tonic, t.mode
FROM lesson_techniques lt
JOIN student_techniques st ON lt.student_technique_id = st.id
JOIN techniques t ON st.technique_id = t.id
WHERE t.teacher_id = 2
GROUP BY t.tonic, t.mode;

-- Get the most recently added repertoire piece
SELECT name, composer, date_added
FROM repertoire
ORDER BY date_added DESC
LIMIT 1;

-- Get the names and descriptions of all teachers whose students include at least one advanced violinist
SELECT DISTINCT t.name, t.description
FROM teachers t
JOIN students s ON t.id = s.teacher_id
WHERE s.skill_level_id = 3 AND s.description LIKE '%violin%';

-- Get the total number of completed repertoire pieces for each student, sorted in descending order
SELECT s.name as student_name, COUNT(sr.id) as completed_repertoire_count
FROM students s
JOIN student_repertoire sr ON s.id = sr.student_id
WHERE sr.completed_at IS NOT NULL
GROUP BY s.name
ORDER BY completed_repertoire_count DESC;

-- Get the names of all students who have not had a lesson with their teacher in the past 2 weeks
SELECT s.name as student_name
FROM students s
JOIN lessons l ON s.id = l.student_id
JOIN teachers t ON l.teacher_id = t.id
WHERE l.date < NOW() - INTERVAL '2 weeks' AND l.teacher_id = s.teacher_id;

-- Get the top 3 most practiced techniques across all students
SELECT t.tonic, t.mode, COUNT(st.id) as practice_count
FROM techniques t
JOIN student_techniques st ON t.id = st.technique_id
GROUP BY t.tonic, t.mode
ORDER BY practice_count DESC
LIMIT 3;

-- Get the average review interval for all completed repertoire pieces for each student
SELECT s.name as student_name, AVG(EXTRACT(DAY FROM sr.review_interval)) as avg_review_interval
FROM students s
JOIN student_repertoire sr ON s.id = sr.student_id
WHERE sr.completed_at IS NOT NULL AND sr.review_interval IS NOT NULL
GROUP BY s.name;