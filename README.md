# Personnel Assessment System (Backend)

## Prerequisites
- Node.js (v18+)
- MySQL database server

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Copy `.env.example` to `.env` and configure your database endpoint and JWT secret.
   ```bash
   cp .env.example .env
   ```
   **Update `DATABASE_URL`** inside `.env` to match your MySQL server configuration (username, password, port, db name).

   Example:
   `DATABASE_URL="mysql://root:root@localhost:3306/assessment_db"`

3. **Database Migration**:
   Sync your Prisma schema with your MySQL database:
   ```bash
   npm run db:push
   ```

4. **Seed Database**:
   Populate the database with sample roles, users, departments, and evaluation templates.
   ```bash
   npm run db:seed
   ```

5. **Start Server**:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:3000`.

## Test Accounts

The following accounts are created after running `npm run db:seed`:
- **Admin**: `admin@example.com` / `password123`
- **Evaluator**: `evaluator@example.com` / `password123`
- **Evaluatee**: `evaluatee@example.com` / `password123`

## API Documentation

- **Swagger**: `http://localhost:3000/api-docs`
- **Postman**: You can import the included `postman_collection.json` file to test the APIs.

### Main APIs & Business Constraints

1. **Authentication**: `/api/auth/login`, `/api/auth/register` (returns JWT)
2. **Admin APIs**: Managed through `/api/admin/*`. Admins enforce evaluatorId != evaluateeId and no duplicate assignments (409).
3. **Weight Limitations**: Admin APIs enforce that total indicator weights per evaluation cannot exceed 100%. Check `/api/admin/topics/:id/indicators` code.
4. **Evaluatee APIs (Evidence)**: Evaluatees use `/api/me/evaluations/:id/evidence` to upload Multer files. Enforces `exe -> 415` and `10MB -> 413`. Only evaluated evidence if required.
5. **Evaluator APIs (Scores)**: Evaluators use `/api/evaluator/assignments/:id/score`. Backend checks if requirement requires evidence before giving the score. Frontend doesn't calculate results; the `/api/reports/evaluation/:id/result` calculates everything dynamically on the backend (Scale 1-4 vs Yes/No).
6. **Reports**: Reports API returns results correctly formatted based on Role.
