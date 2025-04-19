# Project Setup Guide

## Overview
This guide explains how to use Cursor AI to configure your project documentation and structure. Follow these steps in order when starting a new project.

## Setup Process

### 1. Project Requirements (docs/PRD.md)
Use Cursor AI to define:
- Problem Statement/Goals
- Elevator Pitch
- Target Users
- Key Features & User Stories
- Constraints
- Success Metrics

Command: "Help me define the project requirements for [your project type]"

### 2. Technical Architecture (docs/Technical-Spec.md)
Use Cursor AI to configure:
- Tech Stack Selection
- Architecture Design
- Data Models
- API Structure
- Security Requirements
- Performance Requirements

Command: "Help me configure the technical specifications for [your stack preferences]"

### 3. UX Guidelines (docs/UX-Guidelines.md)
Use Cursor AI to establish:
- Design System
- Component Patterns
- Interaction Patterns
- Accessibility Requirements

Command: "Help me define the UX guidelines for [your design preferences]"

### 4. Development Plan (docs/Development-Plan.md)
Use Cursor AI to plan:
- Sprint Structure
- Feature Backlog
- Implementation Order
- Testing Strategy

Command: "Help me create a development plan for [your project scope]"

## Application Structure

### Page Types
1. Public Pages (`app/(public)/`)
   - Landing page
   - Marketing pages
   - Public documentation
   - Terms & Privacy

2. Auth Pages (`app/(auth)/`)
   - Login
   - Registration
   - Password Reset
   - Email Verification
   - OAuth Flows

3. Private Pages (`app/(private)/`)
   - Dashboard
   - User Profile
   - Settings
   - Feature-specific pages

### Route Protection
- Public routes: Accessible to all
- Auth routes: Accessible to non-authenticated users
- Private routes: Requires authentication
- Role-based routes: Requires specific permissions

## Cursor Rules Configuration

### 1. Project Context
Use Cursor AI to define:
- Project-specific guidelines
- Code organization rules
- Documentation requirements

### 2. Tech Stack
Use Cursor AI to specify:
- Required technologies
- Version constraints
- Implementation patterns

### 3. UX Standards
Use Cursor AI to establish:
- Design system rules
- Component guidelines
- Accessibility requirements

### 4. Testing Policy
Use Cursor AI to define:
- Testing requirements
- Coverage thresholds
- Testing patterns

## Getting Started
1. Clone this boilerplate
2. Run setup command: `npm run setup`
3. Follow the Cursor AI prompts to configure each document
4. Review and adjust generated configurations
5. Begin implementation following the development plan 