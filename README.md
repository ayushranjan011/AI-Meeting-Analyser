# AI Meeting Analyser

Real-time emotion analytics dashboard for webcam/video frames.

This project has 3 services:
- `frontend` (React dashboard)
- `backend` (Node.js API + analytics aggregation)
- `AI service` (Python FER/TensorFlow emotion detection)

## Features
- Live webcam frame capture and analysis
- Face box + emotion detection per frame
- Dominant emotion and engagement score
- Live analytics charts (distribution + timeline)
- Session-wise analytics window
- MongoDB support with automatic in-memory fallback

## Tech Stack
- Frontend: React, Axios, Recharts
- Backend: Node.js, Express, Multer, Axios, Mongoose
- AI Service: Flask, OpenCV, FER, TensorFlow

## Project Structure
```text
AI meeting analyser/
|- Ai service/               # Python detection service
|- Backend/                  # Node API + analytics
|- frontend/frontend/        # React app
|- run-all.ps1               # Start all services (Windows)
`- run-all.bat               # Calls run-all.ps1
```

## Prerequisites
- Node.js 18+ and npm
- Python 3.11
- (Optional) MongoDB running locally if you want persistent storage

## Quick Start (Windows)
1. Install Node dependencies from the project root:
```powershell
cd "F:\AI meeting analyser"
npm install
```

2. Setup Python environment (inside `Ai service`):
```powershell
cd "Ai service"
python -m venv venv311
.\venv311\Scripts\pip install -r requirements.txt
```

3. Configure backend env:
```powershell
cd "..\Backend"
Copy-Item .env.example .env
```

4. Start all services from the project root:
```powershell
cd ".."
npm start
```

5. Open:
- Frontend: `http://localhost:3000`
- Backend health: `http://127.0.0.1:4000/health`
- AI health: `http://127.0.0.1:5000/health`

## Manual Start (Alternative)
Run each service in separate terminals:

```powershell
# Terminal 1: AI service
cd "Ai service"
.\venv311\Scripts\python.exe app.py

# Terminal 2: Backend
cd "Backend"
npm start

# Terminal 3: Frontend
cd "frontend\frontend"
npm start
```

## Configuration

### Backend env (`Backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `4000` | Backend API port |
| `AI_SERVICE_URL` | `http://127.0.0.1:5000` | Python AI service base URL |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/ai_meeting_analyser` | MongoDB connection string |
| `REQUEST_TIMEOUT_MS` | `120000` | Timeout for backend -> AI request |
| `MAX_UPLOAD_MB` | `5` | Max uploaded frame size |
| `DEFAULT_SESSION_ID` | `default-session` | Fallback session id |

### Frontend env (optional)
Create `frontend/frontend/.env` if needed:

```env
REACT_APP_BACKEND_URL=http://127.0.0.1:4000/api
REACT_APP_API_TIMEOUT_MS=65000
```

### AI service env (optional)

| Variable | Default | Description |
|---|---|---|
| `AI_PORT` | `5000` | AI service port |
| `AI_DEBUG` | `false` | Flask debug mode |
| `AI_USE_MTCNN` | `true` | More accurate face detection |
| `AI_MAX_WIDTH` | `640` | Max frame width before resize |
| `AI_MIN_FACE_SIZE` | `40` | Minimum face size in pixels for detector |

## API Endpoints

### Backend
- `GET /health`
- `POST /api/analyze-frame` (form-data key: `frame`, optional `sessionId`)
- `POST /api/analyze` (same as above)
- `GET /api/analytics/live?sessionId=<id>&minutes=5&bucketSeconds=5`

### AI service
- `GET /health`
- `POST /detect` (form-data key: `frame`)

## Quick API Test
```powershell
curl.exe -X POST "http://127.0.0.1:4000/api/analyze-frame" ^
  -F "frame=@frontend/frontend/public/logo192.png" ^
  -F "sessionId=test-session"
```

## Troubleshooting

- UI shows `Analyzing Live` but `Faces: 0`:
  - Ensure enough light and full face visibility.
  - Keep some distance from camera (not too close).
  - Detector now auto-falls back from MTCNN to Haar cascade when no face is found.
  - If detection is still weak on your laptop camera, set `AI_USE_MTCNN=false` before starting AI service.

- `AI Latency` stays `0 ms`:
  - Backend may not be receiving analysis response.
  - Check frontend console and backend terminal logs.
  - Verify backend health: `http://127.0.0.1:4000/health`.

- `AI service unreachable`:
  - Make sure Python service is running on port `5000`.
  - Confirm `AI_SERVICE_URL` in `Backend/.env`.

- First call is slow / timeout:
  - TensorFlow warm-up can take 20-60 seconds on first detection.
  - Keep `REQUEST_TIMEOUT_MS=120000`.

- MongoDB not running:
  - App still works with in-memory fallback.
  - Data will reset on backend restart.

## Notes
- This app currently analyzes the local camera feed captured by the browser.
- Meet/Zoom native integration (direct participant stream ingestion) is a separate integration track.
