import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from '@shared/schema';

// First create a connection without database selected
const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root'
});

// Create the database if it doesn't exist
await connection.query('CREATE DATABASE IF NOT EXISTS memorycare');
await connection.query('USE memorycare');

// Drop existing tables if they exist
const dropTableQueries = [
  'DROP TABLE IF EXISTS activities',
  'DROP TABLE IF EXISTS notes',
  'DROP TABLE IF EXISTS quiz_results',
  'DROP TABLE IF EXISTS quizzes',
  'DROP TABLE IF EXISTS photos',
  'DROP TABLE IF EXISTS medications',
  'DROP TABLE IF EXISTS events',
  'DROP TABLE IF EXISTS sessions',
  'DROP TABLE IF EXISTS users'
];

for (const query of dropTableQueries) {
  await connection.query(query);
}

// Create tables if they don't exist
const createTableQueries = [
  `CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'patient',
    UNIQUE KEY username_unique (username)
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) NOT NULL PRIMARY KEY,
    expires BIGINT,
    data TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'event',
    color TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS medications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name TEXT NOT NULL,
    time TEXT NOT NULL,
    frequency TEXT NOT NULL,
    notes TEXT,
    taken TIMESTAMP NULL
  )`,

  `CREATE TABLE IF NOT EXISTS photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    category TEXT,
    date TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    patient_id INT,
    title TEXT NOT NULL,
    questions JSON NOT NULL,
    last_taken TIMESTAMP NULL,
    next_review TIMESTAMP NULL
  )`,

  `CREATE TABLE IF NOT EXISTS quiz_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    user_id INT NOT NULL,
    score INT NOT NULL,
    total_questions INT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSON DEFAULT ('[]'),
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`
];

for (const query of createTableQueries) {
  await connection.query(query);
}

// Create the drizzle database instance
export const db = drizzle(connection, { schema, mode: 'default' });

// Export the connection for session store
export { connection }; 