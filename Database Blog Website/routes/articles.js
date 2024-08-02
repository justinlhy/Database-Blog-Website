const express = require('express');
const router = express.Router();
const { db, authenticateUser, formatDateTime } = require('../index');

// Route - handle rendering the new article form (display form for creating new article)
router.get('/profile/new_article', authenticateUser, (req, res) => {
    const username = req.session.username || 'UserA';
    const blogTitle = `${username}: Blog`;

    // Renders the new_article.ejs template with the title and blogTitle variables
    res.render('new_article', {
        title: 'New Article',
        blogTitle: blogTitle
    });
});

// Route - handle creating a new article (form subission for creating new article)
router.post('/profile/new_article', authenticateUser, (req, res) => {
    const { title, content } = req.body;
    const authorId = req.session.userId; // Use userId from session
    const createdDate = new Date().toISOString();

    // Inserts a new article into the database with the provided variables 
    db.run('INSERT INTO articles (title, content, author_id, status, createdDate) VALUES (?, ?, ?, "draft", ?)', [title, content, authorId, createdDate], (err) => {
        if (err) {
            console.error('Error inserting article:', err.message);
            res.status(500).send('Error inserting article');
        } else {
            console.log('New article inserted:', title);
            res.redirect('/profile');
        }
    });
});

// Route - handle publishing an article (set status to "published" and update publishedDate)
router.post('/profile/article/publish/:articleId', authenticateUser, (req, res) => {
    const articleId = req.params.articleId;
    const publishedDate = new Date().toISOString();

    // Updates the article's status to "published" and sets the publishedDate
    db.run('UPDATE articles SET status = "published", publishedDate = ? WHERE id = ?', [publishedDate, articleId], (err) => {
        if (err) {
            console.error('Error publishing article:', err.message);
            res.status(500).send('Error publishing article');
        } else {
            res.sendStatus(200);
        }
    });
});

// Route - handle deleting an article based on ID
router.delete('/profile/article/:id', authenticateUser, (req, res) => {
    const articleId = req.params.id;

    db.run('DELETE FROM articles WHERE id = ?', [articleId], (err) => {
        if (err) {
            console.error('Error deleting article:', err.message);
            res.status(500).send('Error deleting article');
        } else {
            console.log('Article deleted successfully');
            res.sendStatus(200);
        }
    });
});

// Route - render the edit article page (display form for editing existing article)
router.get('/profile/article/edit/:articleId', authenticateUser, (req, res) => {
    const articleId = req.params.articleId;
    console.log(`Fetching article with ID: ${articleId}`);

    // Fetches the article details from the database using the article ID
    db.get('SELECT * FROM articles WHERE id = ?', [articleId], (err, article) => {
        if (err) {
            console.error('Database error:', err.message);
            res.status(500).send('Database error');
        } else {
            if (article) {
                article.createdDate = formatDateTime(article.createdDate);
                article.publishedDate = article.publishedDate ? formatDateTime(article.publishedDate) : 'Not published';
                console.log('Article found:', article);

                // Renders the edit_article.ejs template with the article details
                res.render('edit_article', {
                    title: 'Edit Article',
                    article: article
                });
            } else {
                console.log(`Article not found with ID: ${articleId}`);
                res.status(404).send('Article not found');
            }
        }
    });
});

// Route - handle the form submission for editing an article and update existing article
router.post('/profile/article/edit/:articleId', authenticateUser, (req, res) => {
    const articleId = req.params.articleId;
    const { title, content } = req.body;

    // Updates the article's title, content, and modifiedDate in the database
    db.run('UPDATE articles SET title = ?, content = ?, modifiedDate = datetime("now") WHERE id = ?', [title, content, articleId], (err) => {
        if (err) {
            console.error('Error updating article:', err.message);
            res.status(500).send('Error updating article');
        } else {
            res.redirect('/profile');
        }
    });
});

module.exports = router;
