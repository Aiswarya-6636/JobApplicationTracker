# Job Application Tracker

## Project Overview
The Job Application Tracker is a web application developed using the MERN stack. It helps users manage job applications, update application statuses, and track follow-up dates.

## Technologies Used
- MongoDB Atlas – Database
- Express.js – Backend framework
- React.js – Frontend library
- Node.js – JavaScript runtime
- Vite – Frontend development tool

## Features
- Add new job applications
- View all applications on the dashboard
- Edit application details
- Delete applications
- Update application status
- Track status history
- Monitor follow-up dates and overdue applications
- Validate application information

## Project Structure
- `backend/` – Server, database models, and API routes
- `frontend/` – React user interface
- `.gitignore` – Excludes private files and unnecessary dependencies
- `backend/.env.example` – Example environment configuration

## Installation and Setup

### Backend
1. Open a terminal in the backend folder.
2. Run `npm install`.
3. Create a `.env` file using `.env.example` as a template.
4. Set your MongoDB Atlas connection string in `MONGO_URI`.
5. Run `npm run dev` if the backend defines that script.

### Frontend
1. Open another terminal in the frontend folder.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local URL shown in the terminal.

## API
The backend uses `/api/applications` for job application operations, including retrieving, creating, updating, and deleting applications.

## Security
Actual database credentials are stored in a local `.env` file and must not be uploaded to a public GitHub repository. The `.env.example` file contains placeholder configuration values.

## Author
Developed as a MERN Stack academic project.
