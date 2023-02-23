\echo 'Delete and recreate soundtrack db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE soundtrack;
CREATE DATABASE soundtrack;
\connect soundtrack

\i soundtrack-schema.sql
\i soundtrack-seed.sql

\echo 'Delete and recreate soundtrack_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE soundtrack_test;
CREATE DATABASE soundtrack_test;
\connect soundtrack_test

\i soundtrack-schema.sql
