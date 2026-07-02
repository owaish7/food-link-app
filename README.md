# Food-Link 🍱

A two-sided marketplace connecting **restaurants with surplus food** to **NGOs that redistribute it** — reducing food waste and fighting food insecurity.

**Live demo:** _add your link here after deploying_

## Features

- **Two-sided platform** — restaurants list surplus food; NGOs browse, request, and receive donations
- **Order lifecycle** — request → accept/decline → fulfill/cancel, with automatic listing blocking and TTL-based expiry
- **Hex-code verification** — both parties exchange unique codes to confirm fulfillment or cancellation, preventing fraudulent order closures
- **Real-time chat** — Socket.IO chat rooms per order, with persisted history
- **Collaborative filtering** — SVD implemented **from scratch** (power iteration) over an NGO × food-type interaction matrix
- **Content-based filtering** — cosine similarity between listing feature vectors and each NGO's preference vector
- **Review sentiment analysis** — TF-IDF + logistic regression classifier scoring every review as positive/negative
- **Route optimization** — shortest path between restaurant and NGO on real road networks (OSMnx + NetworkX), with an optimal midpoint meeting location, rendered on a Leaflet map

## Tech Stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, Vite, Tailwind CSS, React Router, Leaflet, Socket.IO client |
| Backend   | Flask, Flask-SocketIO (eventlet), MongoEngine |
| Database  | MongoDB (Atlas) |
| ML        | NumPy (SVD from scratch), scikit-learn (TF-IDF + logistic regression) |
| Geo       | OSMnx, NetworkX, geopy |

## Local Development

### Backend
```bash
cd server
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env              # then edit .env
python app.py
```
No MongoDB installed? Set `USE_MOCK_DB=1` in `.env` to run against an in-memory database.

### Frontend
```bash
cd client
npm install
cp .env.example .env
npm run dev                       # http://localhost:5173
```

## Deployment (free tier, ~15 minutes)

### 1. MongoDB Atlas (database)
1. Create a free M0 cluster at mongodb.com/atlas
2. Database Access → create a user with password
3. Network Access → allow 0.0.0.0/0 (required for Render's dynamic IPs)
4. Copy the connection string (mongodb+srv://...)

### 2. Render (backend)
1. Push this repo to GitHub
2. On render.com: **New → Blueprint** → select this repo (it reads render.yaml)
3. Set MONGO_URI to your Atlas connection string
4. Set CLIENT_ORIGIN to your Vercel URL (add after step 3; redeploy)
5. Note your backend URL, e.g. https://foodlink-api.onrender.com

### 3. Vercel (frontend)
1. On vercel.com: **New Project** → import this repo
2. Set **Root Directory** to `client`
3. Add environment variable VITE_API_URL = your Render backend URL
4. Deploy — your live link is ready

> **Note:** Render free-tier services sleep after 15 min of inactivity; the first request takes ~50s to wake. Before a demo/interview, open the app once in advance. The first route calculation for a new area downloads OSM road data (~30–60s); results are cached in-process afterwards.

## Architecture

```
client (React/Vite, Vercel)
   │  REST (axios) + WebSocket (Socket.IO)
   ▼
server (Flask + eventlet, Render)
   ├── auth: JWT (httpOnly cookie), werkzeug password hashing
   ├── listings/orders: MongoEngine ODM, TTL index for expiry
   ├── chat: Socket.IO rooms per order, persisted to MongoDB
   ├── recommendations: SVD (from scratch) + content-based cosine similarity
   ├── sentiment: TF-IDF + logistic regression (joblib artifacts)
   └── routing: OSMnx graph download (cached) + NetworkX shortest path
   ▼
MongoDB Atlas
```

## Team

Built at IIIT Jabalpur by Mohammad Owais, Nikhil Chaudhary, Ojasva Tomar, and Nihal Mohammad Ali.
