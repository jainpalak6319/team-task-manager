# TaskFlow — Team Task Manager

A full-stack MERN app for team project and task management with role-based access control.

---

## ✅ Prerequisites — Install these first

| Tool | Download |
|------|----------|
| Node.js (v18+) | https://nodejs.org |
| Git | https://git-scm.com |
| A code editor (VS Code recommended) | https://code.visualstudio.com |

---

## 🚀 Step-by-Step Setup on Your PC

### Step 1 — Get a MongoDB Atlas database (free)

1. Go to https://cloud.mongodb.com and create a free account
2. Click **"Build a Database"** → Choose **Free (M0 Sandbox)**
3. Pick a cloud provider and region → Click **Create**
4. Set a **username** and **password** (save these!)
5. Under **Network Access** → Click **"Add IP Address"** → **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Go to **Clusters** → Click **Connect** → **Drivers** → Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`
   - Replace `<password>` with your actual password
   - Add `teamtaskmanager` at the end: `...mongodb.net/teamtaskmanager?retryWrites=true&w=majority`

---

### Step 2 — Set up the Backend

Open a terminal and run these commands one by one:

```bash
# Navigate into the backend folder
cd team-task-manager/backend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

Now open `.env` in your editor and fill it in:

```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/teamtaskmanager?retryWrites=true&w=majority
JWT_SECRET=mysupersecretkey123changethis
JWT_REFRESH_SECRET=myrefreshsecret456changethis
NODE_ENV=development
```

Then start the backend:

```bash
# Install nodemon globally (for auto-restart on changes)
npm install -g nodemon

# Start backend in development mode
npm run dev
```

✅ You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
```

Test it: Open http://localhost:5000 in your browser → you should see `{"message":"Team Task Manager API running"}`

---

### Step 3 — Set up the Frontend

Open a **second terminal** (keep the backend running in the first):

```bash
# Navigate into the frontend folder
cd team-task-manager/frontend

# Install dependencies
npm install

# Start the frontend
npm run dev
```

✅ You should see:
```
  VITE v5.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser — the app is now running!

---

### Step 4 — Create Demo Users (optional but helpful)

The login page has quick-fill buttons for demo credentials. To make those work, sign up with:
- **Admin**: name=`Admin User`, email=`admin@demo.com`, password=`password123`, role=`admin`
- **Member**: name=`Member User`, email=`member@demo.com`, password=`password123`, role=`member`

Or just sign up with any credentials — the role selector is on the signup page.

---

## 📁 Project Structure

```
team-task-manager/
├── backend/
│   ├── models/
│   │   ├── User.js         # User schema with bcrypt hashing
│   │   ├── Project.js      # Project with members array
│   │   └── Task.js         # Task with comments, priority, status
│   ├── routes/
│   │   ├── auth.js         # POST /signup, /login, GET /me
│   │   ├── projects.js     # Full CRUD + member management
│   │   ├── tasks.js        # Full CRUD + comments
│   │   ├── dashboard.js    # Aggregated stats
│   │   └── users.js        # Admin user management
│   ├── middleware/
│   │   └── auth.js         # protect, adminOnly, projectRole
│   ├── .env                # Your secrets (not committed to git)
│   └── server.js           # Express app entry point
└── frontend/
    └── src/
        ├── api/axios.js    # Axios with JWT interceptor
        ├── context/        # AuthContext (login/logout state)
        ├── pages/          # Dashboard, Projects, Tasks, Team...
        └── components/     # Layout, Sidebar
```

---

## 🌐 Deployment on Railway (Required)

### Backend deployment

1. Go to https://railway.app → Sign up with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Push your backend folder to GitHub first:
   ```bash
   cd team-task-manager/backend
   git init
   git add .
   git commit -m "initial backend"
   # Create a repo on github.com, then:
   git remote add origin https://github.com/YOUR_USERNAME/taskflow-backend.git
   git push -u origin main
   ```
4. In Railway, select your repo → it auto-detects Node.js
5. Go to **Variables** tab → Add these:
   ```
   PORT = 5000
   MONGO_URI = (your MongoDB connection string)
   JWT_SECRET = (any long random string)
   JWT_REFRESH_SECRET = (another long random string)
   NODE_ENV = production
   ```
6. Railway will auto-deploy → copy the generated URL (e.g. `https://taskflow-backend.up.railway.app`)

### Frontend deployment

Option A — Deploy on Railway too:
1. Add `VITE_API_URL=https://your-backend.up.railway.app/api` to frontend `.env`
2. Push frontend to a separate GitHub repo
3. New Railway project → select frontend repo → Add build command: `npm run build`, output dir: `dist`

Option B — Deploy on Vercel (easier for frontend):
1. Push frontend to GitHub
2. Go to https://vercel.com → Import project
3. Add environment variable: `VITE_API_URL=https://your-backend.up.railway.app/api`
4. Deploy → get your live URL

### Update CORS on backend
After deploying frontend, update `server.js` CORS origin to your frontend URL, and add:
```
FRONTEND_URL=https://your-frontend.vercel.app
```
to Railway backend variables.

---

## 🔑 API Endpoints Summary

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login, get JWT |
| GET | /api/auth/me | Get current user |

### Projects
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | /api/projects | ✅ | List my projects |
| POST | /api/projects | ✅ | Create project |
| GET | /api/projects/:id | ✅ member | Get project |
| PUT | /api/projects/:id | ✅ admin | Update project |
| DELETE | /api/projects/:id | ✅ owner | Delete project |
| POST | /api/projects/:id/members | ✅ admin | Add member |
| DELETE | /api/projects/:id/members/:userId | ✅ admin | Remove member |

### Tasks
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| POST | /api/tasks | ✅ member | Create task |
| GET | /api/tasks/:id | ✅ member | Get task |
| PUT | /api/tasks/:id | ✅ member | Update task |
| DELETE | /api/tasks/:id | ✅ creator/admin | Delete task |
| POST | /api/tasks/:id/comments | ✅ member | Add comment |
| GET | /api/tasks/my/assigned | ✅ | My assigned tasks |

### Dashboard & Users
| Method | URL | Auth | Description |
|--------|-----|------|-------------|
| GET | /api/dashboard | ✅ | Stats + recent tasks |
| GET | /api/users | ✅ admin | All users |
| PUT | /api/users/:id/role | ✅ admin | Change role |

---

## 🔐 Role-Based Access Control

- **Admin** (global): Can manage all users via /team page
- **Project owner**: Can delete project, add/remove members
- **Project admin** (member with admin role): Can edit project, manage members
- **Project member**: Can create/edit tasks, add comments
- **Non-member**: No access to project or its tasks

---

 http://localhost:5173/