#!/usr/bin/env node

// Debug script to test the scoring system
const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// Connect to database
mongoose.connect(process.env.CONNECTION_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const Room = require('./models/room');

async function debugScoring() {
    try {
        console.log('🔍 Debugging Scoring System...');
        
        // Find all rooms
        const rooms = await Room.find({});
        console.log(`Found ${rooms.length} rooms in database`);
        
        if (rooms.length > 0) {
            const room = rooms[0];
            console.log('\n📊 Room Details:');
            console.log('Room ID:', room._id);
            console.log('Room Name:', room.name);
            console.log('Started:', room.started);
            console.log('Player Scores:', room.playerScores);
            console.log('Capture Count:', room.captureCount);
            
            console.log('\n🎯 Pawn Details:');
            const pawnsByColor = {};
            room.pawns.forEach(pawn => {
                if (!pawnsByColor[pawn.color]) pawnsByColor[pawn.color] = [];
                pawnsByColor[pawn.color].push({
                    id: pawn._id,
                    position: pawn.position,
                    basePos: pawn.basePos,
                    score: pawn.score || 0
                });
            });
            
            Object.keys(pawnsByColor).forEach(color => {
                const pawns = pawnsByColor[color];
                const totalScore = pawns.reduce((sum, pawn) => sum + pawn.score, 0);
                console.log(`${color.toUpperCase()} pawns: ${pawns.length}, Total Score: ${totalScore}`);
            });
            
            // Test score calculation
            console.log('\n🔧 Testing Score Methods:');
            room.updatePlayerScores();
            console.log('Updated Player Scores:', room.getPlayerScores());
        }
        
        console.log('\n✅ Debug complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('✅ Connected to MongoDB');
    debugScoring();
});

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});