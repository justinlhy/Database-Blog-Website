-- Start a transaction
BEGIN TRANSACTION;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Create articles table with author column referencing user_id
CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    createdDate DATE DEFAULT CURRENT_DATE,
    publishedDate DATE,
    modifiedDate DATE,
    author_id INTEGER NOT NULL,
    status TEXT DEFAULT 'draft',
    likeCount INTEGER DEFAULT 0,
    readCount INTEGER DEFAULT 0,
    FOREIGN KEY(author_id) REFERENCES users(user_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    articleId INTEGER,
    username TEXT,
    comment TEXT,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(articleId) REFERENCES articles(id)
);

-- Create likes table
CREATE TABLE IF NOT EXISTS likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    articleId INTEGER,
    FOREIGN KEY(userId) REFERENCES users(user_id),
    FOREIGN KEY(articleId) REFERENCES articles(id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INTEGER PRIMARY KEY,
    bio TEXT DEFAULT 'No bio available.',
    introduction TEXT DEFAULT 'No introduction available.',
    displayName TEXT,
    blogTitle TEXT DEFAULT '',
    icon TEXT DEFAULT 'user.png',
    FOREIGN KEY(user_id) REFERENCES users(user_id)
);

-- Commit the transaction
COMMIT;
