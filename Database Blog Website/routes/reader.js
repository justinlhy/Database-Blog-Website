const express = require('express');
const router = express.Router();
const { db, authenticateUser, formatDateTime } = require('../index');

// Route - handle the reader home page with sorting
router.get('/reader', (req, res) => {
    let sortBy = req.query.sortBy || 'publishedDate';
    let sortOrder = req.query.sortOrder || 'DESC';

    // Validate sort column
    const validSortColumns = ['publishedDate', 'likeCount', 'readCount'];
    if (!validSortColumns.includes(sortBy)) {
        sortBy = 'publishedDate';
    }

    // Fetch articles sorted by specified column
    db.all(`SELECT articles.*, users.username AS author FROM articles JOIN users ON articles.author_id = users.user_id WHERE articles.status = "published" ORDER BY ${sortBy} ${sortOrder}`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching blogs:', err.message);
            res.status(500).send('Server error');
        } else {
            rows.forEach(row => {
                row.publishedDate = formatDateTime(row.publishedDate);
            });

            // Render reader home with fetched articles
            res.render('reader_home', {
                title: 'Reader Home',
                blogs: rows,
                sortBy: sortBy,
                sortOrder: sortOrder
            });
        }
    });
});

// Route - handle adding a comment
router.post('/profile/article/:articleId/comment', authenticateUser, (req, res) => {
    const { comment } = req.body;
    const articleId = req.params.articleId;
    const username = req.session.username;

    // Insert new comment into database
    db.run('INSERT INTO comments (articleId, username, comment) VALUES (?, ?, ?)', [articleId, username, comment], (err) => {
        if (err) {
            console.error('Error adding comment:', err.message);
            res.status(500).send('Error adding comment');
        } else {
            res.redirect(`/profile/article/${articleId}`);
        }
    });
});

// Route - handle liking an article
router.post('/article/like/:articleId', authenticateUser, (req, res) => {
    const userId = req.session.userId;
    const articleId = req.params.articleId;

    // Check if the user has already liked the article
    db.get('SELECT * FROM likes WHERE userId = ? AND articleId = ?', [userId, articleId], (err, row) => {
        if (err) {
            console.error('Error checking like:', err.message);
            return res.status(500).json({ message: 'Server error' });
        }

        if (row) {
            return res.status(400).json({ message: 'Already liked' });
        }

        // Insert new like and update like count
        db.run('INSERT INTO likes (userId, articleId) VALUES (?, ?)', [userId, articleId], (err) => {
            if (err) {
                console.error('Error liking article:', err.message);
                return res.status(500).json({ message: 'Server error' });
            }

            db.run('UPDATE articles SET likeCount = likeCount + 1 WHERE id = ?', [articleId], (err) => {
                if (err) {
                    console.error('Error updating like count:', err.message);
                    return res.status(500).json({ message: 'Server error' });
                }

                // Fetch the updated like count
                db.get('SELECT likeCount FROM articles WHERE id = ?', [articleId], (err, row) => {
                    if (err) {
                        console.error('Error fetching like count:', err.message);
                        return res.status(500).json({ message: 'Server error' });
                    }

                    res.json({ likeCount: row.likeCount });
                });
            });
        });
    });
});

// Fetch article and comments with icons
router.get('/profile/article/:articleId', (req, res) => {
    const articleId = req.params.articleId;

    // Increment the read count
    db.run('UPDATE articles SET readCount = readCount + 1 WHERE id = ?', [articleId], (err) => {
        if (err) {
            console.error('Error updating read count:', err.message);
        }
    });

    // Fetch the article and comments with icon information
    const articleQuery = 'SELECT articles.*, users.username AS author, user_profiles.icon FROM articles JOIN users ON articles.author_id = users.user_id JOIN user_profiles ON users.user_id = user_profiles.user_id WHERE articles.id = ?';
    db.get(articleQuery, [articleId], (err, article) => {
        if (err) {
            console.error('Error fetching article:', err.message);
            res.status(500).send('Error fetching article');
        } else if (article) {
            const commentsQuery = 'SELECT comments.*, user_profiles.icon FROM comments JOIN users ON comments.username = users.username JOIN user_profiles ON users.user_id = user_profiles.user_id WHERE comments.articleId = ?';
            db.all(commentsQuery, [articleId], (err, comments) => {
                if (err) {
                    console.error('Error fetching comments:', err.message);
                    res.status(500).send('Error fetching comments');
                } else {
                    article.publishedDate = formatDateTime(article.publishedDate);

                    // Render blog template with fetched article and comments
                    res.render('blog_template', {
                        title: article.title,
                        article: article,
                        comments: comments
                    });
                }
            });
        } else {
            console.error('Article not found with id:', articleId);
            res.status(404).send('Article not found');
        }
    });
});

module.exports = router;
