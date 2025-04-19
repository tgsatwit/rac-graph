Cursor Rules for Project

# Project Overview

**Project Name:** Creative Tech Portfolio Site

**Description:** This is a modern website designed to showcase various personal projects, ranging from software development to creative tech endeavors. The site also features an authenticated section where users can capture and manage inspiration for their app development projects.

**Tech Stack:**

*   Frontend: React (or similar framework using V0 by Vercel)
*   Backend: Firebase Authentication
*   Database: Cloud-based for storing user-generated content
*   IDEs: Cursor AI, Replit

**Key Features:**

*   Project showcase of diverse tech and creative works
*   Authenticated section for inspiration capturing and management
*   Tag and search functionalities for easy content retrieval
*   User roles for content access control
*   Responsive and compliant with accessibility standards

# Project Structure

## Root Directory:

*   Contains the main configuration files and documentation.

## /frontend:

*   Contains all frontend-related code, including components, styles, and assets.

### /components:

*   Navigation
*   Project Showcase
*   User Authentication
*   Inspiration Management

### /assets:

*   Logo and branding images
*   Sample project images

### /styles:

*   Global stylesheets
*   Theme management

## /backend:

*   Contains all backend-related code, API routes, and database models.

### /controllers:

*   UserAuthenticationController
*   InspirationController

### /models:

*   UserModel
*   InspirationModel

### /routes:

*   AuthRoutes
*   InspirationRoutes

### /config:

*   FirestoreConfig
*   AuthenticationConfig

## /tests:

*   Contains unit and integration tests for both frontend and backend.

# Development Guidelines

**Coding Standards:**

*   Adhere to the Airbnb style guide for JavaScript/React.

**Component Organization:**

*   Use functional components and hooks.

# Cursor IDE Integration

**Setup Instructions:**

*   Clone the repository and open it in Cursor IDE.
*   Set up local dev environment as per README.

**Key Commands:**

*   npm start: Run the development server
*   npm test: Run the test suite

# Additional Context

**User Roles:**

*   Regular Users: Access to public content
*   Authenticated Users: Access to inspiration capturing features

**Accessibility Considerations:**

*   Ensure site meets WCAG 2.1 standards
*   Provide alt text for all images
*   Implement keyboard navigable interface
