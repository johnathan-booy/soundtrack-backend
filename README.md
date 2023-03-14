# SoundTrack Academy API

The SoundTrack Academy API allows teachers to register and login. Teachers can include a Bearer authentication token in their requests, which will authenticate them. Admin teachers can access most resources, but all other teachers are restricted to resources that match their teacherId. The API follows RESTful routing conventions.

## Routes

### Teachers

GET /teachers: Get a list of all teachers.  
GET /teachers/:id: Get a specific teacher by ID.  
POST /teachers: Create a new teacher.  
PATCH /teachers/:id: Update a teacher by ID.  
DELETE /teachers/:id: Delete a teacher by ID.  
GET /teachers/:id/lessons: Get all lessons associated with a specific teacher.

### Students

GET /students: Get a list of all students.  
GET /students/:id: Get a specific student by ID.  
POST /students: Create a new student.  
PATCH /students/:id: Update a student by ID.  
DELETE /students/:id: Delete a student by ID.  
GET /students/:id/lessons: Get all lessons associated with a specific student.

### Lessons

POST /lessons: Create a new lesson.  
PATCH /lessons/:id: Update a lesson by ID.  
DELETE /lessons/:id: Delete a lesson by ID.

### Authentication

POST /auth/login: Authenticate a teacher.  
POST /auth/register: Register a new teacher.

### Skill levels

GET /skill-levels: Get a list of all skill levels.

## Authentication

To authenticate with the API, a teacher must include a Bearer authentication token in their requests. This token is obtained by authenticating with the /auth/login route. Admin teachers can access most resources, but all other teachers are restricted to resources that match their teacherId.

## Database

The SoundTrack Academy API uses PostgreSQL as its database. The database is already initialized with the future addition of lesson_techniques and lesson_repertoire in mind.

## Running the API

To run the API:

1. Clone the repository
2. Run `npm install` to install the necessary dependencies.
3. Run `npm run init` to initialize the Postgres database with seed data
4. Then, run `npm run start` or `npm run dev` to start the server

## Scripts

`npm run start`: Start the server.  
`npm run dev`: Start the server in development mode with nodemon.  
`npm run test`: Run the test suite.  
`npm run init`: Initialize the database. WARNING: This script will create a new database and delete any existing data. Use with caution.

## Dependencies

The SoundTrack Academy API has the following dependencies:

- express
- pg
- bcrypt
- jsonwebtoken
- supertest
- yup
- morgan
- cors
- colors
