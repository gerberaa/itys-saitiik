# Glass UI Website

A modern website with a glass UI design and authentication system.

## Features

- Beautiful glass UI design
- User authentication (login/register)
- Protected routes
- MongoDB database integration
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd glass-ui-website
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/glass-ui
SESSION_SECRET=your-super-secret-key-change-this-in-production
```

4. Make sure MongoDB is running on your system.

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
glass-ui-website/
├── config/
│   └── passport.js
├── models/
│   └── User.js
├── public/
│   └── css/
├── routes/
│   ├── auth.js
│   └── main.js
├── views/
│   ├── auth/
│   │   ├── login.ejs
│   │   └── register.ejs
│   ├── index.ejs
│   ├── search.ejs
│   ├── gallery.ejs
│   ├── top.ejs
│   └── profile.ejs
├── .env
├── app.js
├── package.json
└── README.md
```

## Security

- Passwords are hashed using bcrypt
- Sessions are stored in MongoDB
- Protected routes require authentication
- CSRF protection
- Secure session configuration

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 