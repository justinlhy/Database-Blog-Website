const express = require('express');
const router = express.Router();
const { db } = require('../index');

// Route - render the signup form
router.get('/add_user', (req, res) => {
    res.render('add_user', { title: 'Add User' });
});

// Route - handle user registration form submission
router.post('/add_user', (req, res) => {
    const { username, email, password } = req.body;

    // Check if the username or email already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).send('Database error');
        } else if (row) {
            // Respond with an error if the username or email is taken
            if (row.username === username) {
                res.status(400).send('Username already exists');
            } else {
                res.status(400).send('Email already exists');
            }
        } else {
            // Insert the new user into the database
            db.run('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, password], function (err) {
                if (err) {
                    console.error('Error inserting user:', err.message);
                    res.status(500).send('Error inserting user');
                } else {
                    const userId = this.lastID;
                    // Insert default profile info for the new user
                    db.run('INSERT INTO user_profiles (user_id, bio, introduction, displayName, blogTitle, icon) VALUES (?, ?, ?, ?, ?, ?)',
                        [userId, 'No bio available.', 'No introduction available.', username, `${username}'s Blog`, 'user.png'], (err) => {
                            if (err) {
                                console.error('Error inserting user profile:', err.message);
                                res.status(500).send('Error inserting user profile');
                            } else {
                                console.log('New user and profile inserted:', username);
                                res.redirect('/login');
                            }
                        });
                }
            });
        }
    });
});

// Route - check if the username exists
router.get('/check-username', (req, res) => {
    const { username } = req.query;

    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ exists: false });
        } else {
            res.json({ exists: !!row });
        }
    });
});

// Route to check if the email already exists
router.get('/check-email', (req, res) => {
    const email = req.query.email;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ exists: false, error: 'Database error' });
        } else if (row) {
            res.json({ exists: true });
        } else {
            res.json({ exists: false });
        }
    });
});

// Route - handle user login form
router.get('/login', (req, res) => {
    res.render('login', { title: 'Login', errorMessage: null });
});

// Route - handle user login
router.post('/login', (req, res) => {
    const { usernameOrEmail, password } = req.body;

    // Verify the user's credentials
    db.get('SELECT * FROM users WHERE (username = ? OR email = ?) AND password = ?', [usernameOrEmail, usernameOrEmail, password], (err, row) => {
        if (err) {
            console.error('Database error:', err.message);
            res.render('login', { title: 'Login', errorMessage: 'Database error' });
        } else if (row) {
            // Fetch user profile information
            db.get('SELECT bio, introduction, displayName FROM user_profiles WHERE user_id = ?', [row.user_id], (err, profile) => {
                if (err) {
                    console.error('Database error:', err.message);
                    res.render('login', { title: 'Login', errorMessage: 'Database error' });
                } else {
                    // Set session variables for the authenticated user
                    req.session.authenticated = true;
                    req.session.username = row.username;
                    req.session.userId = row.user_id;
                    req.session.bio = profile ? profile.bio : 'No bio available.';
                    req.session.introduction = profile ? profile.introduction : 'No introduction available.';
                    req.session.displayName = profile ? profile.displayName : row.username;
                    req.session.blogTitle = profile ? profile.blogTitle : `${row.username}'s Blog`;

                    res.redirect('/profile');
                }
            });
        } else {
            res.render('login', { title: 'Login', errorMessage: 'Invalid username/email or password' });
        }
    });
});

// Route - handle user logout
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Logout error');
        }
        res.redirect('/login');
    });
});

// Route - check session info (for debugging)
router.get('/session-info', (req, res) => {
    res.json(req.session);
});

module.exports = router;
