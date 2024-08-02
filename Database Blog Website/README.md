# Database Network and the Web - Mid Term Submission

## Description
Follow the instructions below to set up and run the application.

## Setup Instructions

### Prerequisites
- Node.js (>= 16.0.0)
- npm (>= 8.0.0)

### Requirements 
Author - Home page - Profile tab (Sign up and Login is required)

Author - Settings page - Profile -> Settings

Author - Edit article page - Profile -> Edit article 

Reader - Home page - Reader Home tab

Reader - Article page - Reader Home -> Click on article created by author

Main Home Page - Default Home page display

In Order to access the author profile page (to create and publish article), sign ups and login is required. Same goes for interactions (commenting and liking article)
Reading article can be access by anyone, by clicking on the reader home page

### Steps to Set Up

1. **Install Dependencies**
```npm install``

2. **Build the database**

For Unix-based systems (Linux, macOS):
```npm run build-db```

For Windows:
```npm run build-db-win```

3. **Start the application**
```npm run start```


### Additional Libraries Used
* bcrypt: "^5.1.1" - For hashing passwords.
* ejs: "^3.1.10" - Embedded JavaScript templates for rendering HTML.
* express: "^4.18.2" - Fast, unopinionated, minimalist web framework for Node.js.
* express-session: "^1.18.0" - Simple session middleware for Express.
