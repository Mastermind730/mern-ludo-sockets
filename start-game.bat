@echo off
echo 🎮 Starting MERN Ludo Game with Scoring System
echo =============================================

echo.
echo 🔧 Starting Backend Server on Port 8080...
start "Backend Server" cmd /k "cd /d d:\Projects\mern-ludo\backend && npm start"

timeout /t 3 > nul

echo.
echo 🎨 Starting Frontend Server on Port 3000...
start "Frontend Server" cmd /k "cd /d d:\Projects\mern-ludo && npm start"

echo.
echo 🎉 Both servers are starting!
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:8080
echo.
pause