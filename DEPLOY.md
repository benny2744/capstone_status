# Student Dashboard - Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Free Tier Available)
1. Create account at [railway.app](https://railway.app)
2. Connect your GitHub repo or drag & drop this folder
3. Set environment variables:
   - `SECRET_KEY`: A random string for session security
   - `FLASK_DEBUG`: `false`
4. Deploy!

### Option 2: Render
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect repo or upload
3. Build Command: `pip install -r server/requirements.txt`
4. Start Command: `cd server && gunicorn app:app`
5. Add environment variables as above

### Option 3: Any VPS (DigitalOcean, Linode, etc.)
```bash
# Clone/upload the project
cd student-dashboard

# Install dependencies
pip install -r server/requirements.txt

# Run with gunicorn (production)
cd server
gunicorn --bind 0.0.0.0:8080 app:app
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Random string for session encryption |
| `FLASK_DEBUG` | No | Set to `false` in production |
| `PORT` | No | Default: 5001 |

## Default Credentials

⚠️ **Change these before deploying!**

Edit `server/app.py` line ~17:
```python
USERS = {
    "admin": generate_password_hash("your-secure-password"),
    "teacher": generate_password_hash("another-secure-password"),
}
```

## Folder Structure for Deployment
```
student-dashboard/
├── dist/                 # Built frontend (auto-served)
├── server/
│   ├── app.py           # Flask server
│   └── requirements.txt # Python dependencies
├── src/data/
│   └── students.json    # Student data
└── public/photos/       # Student photos
```

## Security Notes
- Always change default passwords
- Use HTTPS in production (most platforms handle this)
- Set a strong `SECRET_KEY` environment variable
- Consider adding rate limiting for production
