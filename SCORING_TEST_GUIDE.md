# 🎯 Scoring System Testing Guide

## Quick Start

1. **Start Both Servers:**
   ```bash
   # Option 1: Use the batch file (Windows)
   ./start-game.bat
   
   # Option 2: Manual startup
   # Terminal 1 - Backend
   cd backend
   npm start
   
   # Terminal 2 - Frontend  
   npm start
   ```

2. **Open Game in Browser:**
   - Navigate to `http://localhost:3000`
   - Create a new room or join existing room
   - Add at least 2 players and start the game

## 🔍 How to Test Scoring

### 1. **Pawn Movement Scoring**
- Roll dice and move pawns
- Each pawn earns points equal to the dice value rolled
- Watch the LiveScoreboard update in real-time

### 2. **Capture Mechanics** 
- Land on opponent's pawn to capture it
- Striker gains all victim's accumulated points
- Victim's score resets to 0
- Capture count increases for attacking player

### 3. **Player Scores**
- Player's total = sum of all their pawn scores
- Rankings update automatically based on scores
- Tie-breaker uses capture count

### 4. **Timer-Based Wins**
- If timer expires, highest score wins
- Capture count breaks ties

## 🐛 Debugging Tools

1. **Database Debug Script:**
   ```bash
   cd backend
   node debug-scoring.js
   ```

2. **Browser Console:**
   - Check for 'game:scores' socket events
   - Look for scoring data updates

3. **Backend Logs:**
   - Watch for score update emissions
   - Monitor database operations

## ✅ Verification Checklist

- [ ] Backend server running on port 8080
- [ ] Frontend connecting to backend successfully  
- [ ] LiveScoreboard component visible during gameplay
- [ ] Pawn scores increase when moving
- [ ] Captures transfer scores correctly
- [ ] Real-time score updates work
- [ ] Winner determined by score + captures

## 🔧 Common Issues

1. **"PRO FEATURE ONLY" errors:**
   - Ensure backend server is running
   - Check port 8080 is not blocked

2. **Scores not updating:**
   - Verify Socket.IO connection
   - Check browser console for errors
   - Ensure game has started (not just joined)

3. **LiveScoreboard empty:**
   - Make sure at least 2 players joined
   - Game must be started to show scores