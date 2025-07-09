# Software-Design-Project
**Quick Setup**
1. Run: `npm install` in root
2. Run: `npm run setup` in root
3. Run: `npm run dev` in root <br>
     **Note:** Might have to run both `npm run setup` and `npm run dev` every time the web app is run

**Manual Setup**
1. Run: `npm install` in root
2. Terminal 1 - Backend: 
    <br>Mac: `cd backend && npm install && npm run dev`
    <br>Windows: `cd backend; npm install; npm run dev`
3. Terminal 2 - Frontend: 
    <br>Mac: `cd frontend && npm install && npm start`
    <br>Windows: `cd frontend; npm install; npm start`

**Manual Setup (Alternative)**
1. Run: `npm install` in root
2. Run: `npm run setup` in root
3. Terminal 1 - Backend: `cd backend` -> `npm run dev`
4. Terminal 2 - Frontend: `cd frontend` -> `npm start`

<br>

`npm install` - Install dependencies 
<br>`npm run setup` - Install dependencies for both frontend and backend
<br>`cd backend` -> `npm run test` - Run backend tests (jest)
<br>`cd backend` -> `coverage/lcov-report/index.html` (Code Coverage HTML)

<br> 

**Ignore Below** 

<br> 

**Global**

npm install firebase

npm install axios

npm install dotenv

<br>

**Frontend:**

cd frontend 

npm install react-scripts

npm install react-router-dom

npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

npm start

<br>

**Backend:** 

cd backend

npm run dev

<br> 

**Database**

  
`sudo su - postgres`
<br>Start: `/Library/PostgreSQL/17/data start`
<br>Stop: `/Library/PostgreSQL/17/data stop`
<br>Restart: `/Library/PostgreSQL/17/data restart`
<br>Server Status: `/Library/PostgreSQL/17/bin/pg_ctl -D /Library/PostgreSQL/17/data status`<br>

  
1. `/Library/PostgreSQL/17/bin/psql`  
List Databases: `\l`
<br>Connect to DB: `\c your_db_name`
<br>List all Tables: `\dt`
Describe Table Columns: `\d tablename`
  
2. Exit Shell: `\q`



