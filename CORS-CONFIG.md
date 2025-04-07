# CORS Configuration Guide

This project uses a centralized CORS (Cross-Origin Resource Sharing) configuration system that can be fully controlled through environment variables in `.env` files.

## Overview

CORS settings are defined in the root `.env` file and are automatically applied to both the main server and the backend server. The frontend is configured to use the API URL defined in its own `.env` file.

## Configuration Options

All CORS settings are controlled through the following environment variables in the root `.env` file:

| Variable | Description | Default Value | Example |
|----------|-------------|---------------|---------|
| `CORS_ORIGINS` | Comma-separated list of allowed origins | Empty (allows all origins) | `http://localhost:5173,http://localhost:5174` |
| `CORS_CREDENTIALS` | Whether to allow credentials (cookies, auth headers) | `false` | `true` |
| `CORS_MAX_AGE` | How long preflight requests can be cached (in seconds) | `3600` | `86400` |
| `CORS_METHODS` | Comma-separated list of allowed HTTP methods | `GET,POST,PUT,DELETE,OPTIONS` | `GET,POST,PUT,DELETE,OPTIONS,PATCH` |
| `CORS_HEADERS` | Comma-separated list of allowed headers | `Content-Type,Authorization` | `Content-Type,Authorization,X-Requested-With` |

## How to Configure

1. **Root Configuration**: Edit the `.env` file in the project root directory to set the CORS settings for all servers.

   ```
   # CORS Configuration
   CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
   CORS_CREDENTIALS=true
   CORS_MAX_AGE=3600
   CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS,PATCH
   CORS_HEADERS=Content-Type,Authorization,X-Requested-With,Accept
   ```

2. **Frontend Configuration**: Edit the `fr/.env` file to set the API URL that the frontend will use.

   ```
   # Frontend API Configuration
   VITE_API_URL=http://localhost:3000
   
   # This should match one of the allowed origins in the root .env CORS_ORIGINS
   VITE_FRONTEND_URL=http://localhost:5173
   ```

## Important Notes

- The frontend URL (`VITE_FRONTEND_URL`) should match one of the allowed origins in the `CORS_ORIGINS` list.
- If `CORS_ORIGINS` is empty, all origins will be allowed (not recommended for production).
- Changes to `.env` files require restarting the servers to take effect.

## Troubleshooting CORS Issues

If you encounter CORS errors in the browser console:

1. Check that the frontend URL is included in the `CORS_ORIGINS` list.
2. Ensure `CORS_CREDENTIALS` is set to `true` if your requests include credentials.
3. Verify that all required headers are included in the `CORS_HEADERS` list.
4. Restart both the backend and frontend servers after making changes to `.env` files.

## Example Configuration for Different Environments

### Development

```
# Root .env
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173
CORS_CREDENTIALS=true

# Frontend .env
VITE_API_URL=http://localhost:3000
```

### Production

```
# Root .env
CORS_ORIGINS=https://your-app.com,https://admin.your-app.com
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400

# Frontend .env
VITE_API_URL=https://api.your-app.com
```
