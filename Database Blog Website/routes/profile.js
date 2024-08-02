const express = require('express');
const router = express.Router();
const { db, authenticateUser, formatDateTime } = require('../index');

// Seetings page -----------------------------------------------------------------------------------------------------------------------------------
// Route - render the settings page
router.get('/profile/settings', authenticateUser, (req, res) => {
    const userId = req.session.userId;

    // Fetch user and profile data to pre-fill the settings form
    db.get('SELECT username, email FROM users WHERE user_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).send('Database error');
        } else {
            db.get('SELECT bio, introduction, displayName, blogTitle, icon FROM user_profiles WHERE user_id = ?', [userId], (err, profile) => {
                if (err) {
                    console.error('Database error:', err.message);
                    res.status(500).send('Database error');
                } else {
                    const displayName = profile ? profile.displayName || user.username : user.username;
                    const blogTitle = profile ? profile.blogTitle || `${displayName}'s Blog` : `${displayName}'s Blog`;
                    const bio = profile ? profile.bio : '';
                    const introduction = profile ? profile.introduction : '';
                    const icon = profile ? profile.icon || 'user.png' : 'user.png';

                    // Render settings page with fetched data
                    res.render('settings', {
                        title: 'Settings',
                        displayName: displayName,
                        blogTitle: blogTitle,
                        bio: bio,
                        introduction: introduction,
                        username: user.username,
                        email: user.email,
                        icon: icon
                    });
                }
            });
        }
    });
});

// Route to handle the settings form submission
router.post('/profile/settings', authenticateUser, (req, res) => {
    const { username, email, password, blogTitle, displayName, introduction, bio, icon } = req.body;
    const userId = req.session.userId;

    // Fetch the current user
    db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).send('Database error');
        } else if (user) {
            // Only update the password if a new one is provided
            const updatedPassword = password ? password : user.password;

            // Update user data
            db.run('UPDATE users SET username = ?, email = ?, password = ? WHERE user_id = ?', [username, email, updatedPassword, userId], (err) => {
                if (err) {
                    console.error('Error updating user:', err.message);
                    res.status(500).send('Error updating user');
                } else {
                    // Update or insert profile data
                    db.run('INSERT OR REPLACE INTO user_profiles (user_id, bio, introduction, displayName, blogTitle, icon) VALUES (?, ?, ?, ?, ?, ?)', [userId, bio, introduction, displayName, blogTitle, icon], (err) => {
                        if (err) {
                            console.error('Error updating user profile:', err.message);
                            res.status(500).send('Error updating user profile');
                        } else {
                            // Update session data
                            req.session.username = username;
                            req.session.email = email;
                            req.session.bio = bio;
                            req.session.introduction = introduction;
                            req.session.displayName = displayName;
                            req.session.blogTitle = blogTitle;
                            req.session.icon = icon;

                            res.redirect('/profile');
                        }
                    });
                }
            });
        } else {
            res.status(400).send('User not found');
        }
    });
});

// Route - Profile check current password
router.get('/profile/check-password', authenticateUser, (req, res) => {
    const userId = req.session.userId;
    const currentPassword = req.query.password;

    // Check if the provided current password matches the stored password
    db.get('SELECT password FROM users WHERE user_id = ?', [userId], (err, user) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).json({ valid: false, error: 'Database error' });
        } else if (user) {
            if (user.password === currentPassword) {
                res.json({ valid: true });
            } else {
                res.json({ valid: false });
            }
        } else {
            res.json({ valid: false });
        }
    });
});

// Seetings page -----------------------------------------------------------------------------------------------------------------------------------
// Route - render the profile page
router.get('/profile', authenticateUser, (req, res) => {
    const userId = req.session.userId;
    const sortBy = req.query.sortBy || 'publishedDate';
    const sortOrder = req.query.sortOrder || 'DESC';

    // Validate the sort column
    const validSortColumns = ['publishedDate', 'likeCount', 'readCount', 'status'];
    if (!validSortColumns.includes(sortBy)) {
        sortBy = 'publishedDate';
    }

    // Fetch user's articles sorted by the specified column
    db.all(`SELECT *, datetime(createdDate, "localtime") as createdDate, datetime(modifiedDate, "localtime") as modifiedDate FROM articles WHERE author_id = ? ORDER BY ${sortBy} ${sortOrder}`, [userId], (err, rows) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).send('Database error');
        } else {
            // Fetch user profile data
            db.get('SELECT bio, introduction, displayName, blogTitle, icon FROM user_profiles WHERE user_id = ?', [userId], (err, profile) => {
                if (err) {
                    console.error('Database error:', err.message);
                    res.status(500).send('Database error');
                } else {
                    const displayName = profile ? profile.displayName || req.session.username : req.session.username;
                    const blogTitle = profile ? profile.blogTitle || `${displayName}'s Blog` : `${displayName}'s Blog`;
                    const bio = profile ? profile.bio : 'No bio available.';
                    const introduction = profile ? profile.introduction : 'No introduction available.';
                    const icon = profile ? profile.icon || 'user.png' : 'user.png';

                    // Format article dates
                    rows.forEach(article => {
                        article.createdDate = formatDateTime(article.createdDate);
                        article.modifiedDate = article.modifiedDate ? formatDateTime(article.modifiedDate) : 'Not modified';
                        article.publishedDate = article.publishedDate ? formatDateTime(article.publishedDate) : 'Not published';
                        article.status = article.status || 'draft';
                    });

                    // Render profile page with fetched data
                    res.render('profile', {
                        title: 'Profile',
                        username: req.session.username,
                        displayName: displayName,
                        blogTitle: blogTitle,
                        bio: bio,
                        introduction: introduction,
                        icon: icon,
                        articles: rows,
                        sortBy: sortBy,
                        sortOrder: sortOrder
                    });
                }
            });
        }
    });
});

module.exports = router;
