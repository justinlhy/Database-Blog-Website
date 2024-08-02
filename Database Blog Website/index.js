const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dbPath = './database.db';
const app = express();
const port = 3000;

// Check if the database file exists, create it if it doesn't
if (!fs.existsSync(dbPath)) {
    fs.closeSync(fs.openSync(dbPath, 'w'));
}

// Initialize SQLite database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
    console.log('Connected to the SQLite database.');
});

// Set up session middleware
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, 
        maxAge: 1000 * 60 * 60 
    }
}));

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));

// Set view engine to EJS
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to authenticate user session
const authenticateUser = (req, res, next) => {
    if (req.session.authenticated) {
        next();
    } else {
        res.redirect('/login');
    }
};

// Helper function to format dates
const formatDateTime = (date) => {
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Singapore'
    };
    const dateTime = new Date(date).toLocaleString('en-SG', options);
    const [datePart, timePart] = dateTime.split(', ');
    const [time, period] = timePart.split(' ');
    return `${datePart} ${time} ${period.toUpperCase()}`;
};

// Export db and middleware
module.exports = { db, authenticateUser, formatDateTime };

// Import and use routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const articleRoutes = require('./routes/articles');
const readerRoutes = require('./routes/reader');

app.use(authRoutes);
app.use(profileRoutes);
app.use(articleRoutes);
app.use(readerRoutes);

// Route to handle requests to the home page
app.get('/', (req, res) => {
    res.render('index', { title: 'Home' });
});

// Start server
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
