const mongoose = require('mongoose');
const { COLORS, MOVE_TIME } = require('../utils/constants');
const { makeRandomMove } = require('../handlers/handlersFunctions');
const timeoutManager = require('./timeoutManager.js');
const PawnSchema = require('./pawn');
const PlayerSchema = require('./player');

const RoomSchema = new mongoose.Schema({
    name: String,
    private: { type: Boolean, default: false },
    password: String,
    createDate: { type: Date, default: Date.now },
    started: { type: Boolean, default: false },
    full: { type: Boolean, default: false },
    nextMoveTime: Number,
    rolledNumber: Number,
    players: [PlayerSchema],
    winner: { type: String, default: null },
    playerScores: {
        type: Object,
        default: () => ({ red: 0, blue: 0, green: 0, yellow: 0 }),
    },
    captureCount: {
        type: Object,
        default: () => ({ red: 0, blue: 0, green: 0, yellow: 0 }),
    },
    pawns: {
        type: [PawnSchema],
        default: () => {
            const startPositions = [];
            for (let i = 0; i < 16; i++) {
                let pawn = {};
                pawn.basePos = i;
                pawn.position = i;
                pawn.score = 0;
                if (i < 4) pawn.color = COLORS[0];
                else if (i < 8) pawn.color = COLORS[1];
                else if (i < 12) pawn.color = COLORS[2];
                else if (i < 16) pawn.color = COLORS[3];
                startPositions.push(pawn);
            }
            return startPositions;
        },
    },
});

RoomSchema.methods.beatPawns = function (position, attackingPawnColor, attackingPawnId) {
    const pawnsOnPosition = this.pawns.filter(pawn => pawn.position === position);
    let totalCapturedScore = 0;
    let capturesCount = 0;

    pawnsOnPosition.forEach(pawn => {
        if (pawn.color !== attackingPawnColor) {
            const index = this.getPawnIndex(pawn._id);
            // Transfer victim's score to attacker
            totalCapturedScore += this.pawns[index].score;
            // Reset victim's score and send to base
            this.pawns[index].score = 0;
            this.pawns[index].position = this.pawns[index].basePos;
            capturesCount++;
        }
    });

    // Add captured score to attacking pawn
    if (totalCapturedScore > 0 && attackingPawnId) {
        const attackingPawnIndex = this.getPawnIndex(attackingPawnId);
        if (attackingPawnIndex !== -1) {
            this.pawns[attackingPawnIndex].score += totalCapturedScore;
        }
    }

    // Update capture count for attacking player
    if (capturesCount > 0) {
        this.captureCount[attackingPawnColor] = (this.captureCount[attackingPawnColor] || 0) + capturesCount;
    }

    return { capturedScore: totalCapturedScore, capturesCount };
};

RoomSchema.methods.changeMovingPlayer = function () {
    if (this.winner) return;
    const playerIndex = this.players.findIndex(player => player.nowMoving === true);
    this.players[playerIndex].nowMoving = false;
    if (playerIndex + 1 === this.players.length) {
        this.players[0].nowMoving = true;
    } else {
        this.players[playerIndex + 1].nowMoving = true;
    }
    this.nextMoveTime = Date.now() + MOVE_TIME;
    this.rolledNumber = null;
    timeoutManager.clear(this._id.toString());
    timeoutManager.set(makeRandomMove, MOVE_TIME, this._id.toString());
};

RoomSchema.methods.movePawn = function (pawn) {
    const newPositionOfMovedPawn = pawn.getPositionAfterMove(this.rolledNumber);

    // Update pawn position
    this.changePositionOfPawn(pawn, newPositionOfMovedPawn);

    // Update pawn score based on movement
    const pawnIndex = this.getPawnIndex(pawn._id);
    if (pawnIndex !== -1) {
        const stepsMoved = this.rolledNumber; // Use dice value as steps for scoring
        this.pawns[pawnIndex].score += stepsMoved;
    }

    // Handle captures and update scores
    const captureResult = this.beatPawns(newPositionOfMovedPawn, pawn.color, pawn._id);

    // Update player scores
    this.updatePlayerScores();

    return captureResult;
};

RoomSchema.methods.getPawnsThatCanMove = function () {
    const movingPlayer = this.getCurrentlyMovingPlayer();
    const playerPawns = this.getPlayerPawns(movingPlayer.color);
    return playerPawns.filter(pawn => pawn.canMove(this.rolledNumber));
};

RoomSchema.methods.changePositionOfPawn = function (pawn, newPosition) {
    const pawnIndex = this.getPawnIndex(pawn._id);
    this.pawns[pawnIndex].position = newPosition;
};

// Method to update player scores based on all their pawns
RoomSchema.methods.updatePlayerScores = function () {
    const colors = ['red', 'blue', 'green', 'yellow'];

    colors.forEach(color => {
        const playerPawns = this.getPlayerPawns(color);
        const totalScore = playerPawns.reduce((sum, pawn) => sum + (pawn.score || 0), 0);
        this.playerScores[color] = totalScore;
    });
};

// Method to get current player scores
RoomSchema.methods.getPlayerScores = function () {
    return {
        playerScores: this.playerScores,
        captureCount: this.captureCount,
    };
};

RoomSchema.methods.canStartGame = function () {
    return this.players.filter(player => player.ready).length >= 2;
};

RoomSchema.methods.startGame = function () {
    this.started = true;
    this.nextMoveTime = Date.now() + MOVE_TIME;
    this.players.forEach(player => (player.ready = true));
    this.players[0].nowMoving = true;
    timeoutManager.set(makeRandomMove, MOVE_TIME, this._id.toString());
};

RoomSchema.methods.endGame = function (winner) {
    timeoutManager.clear(this._id.toString());
    this.rolledNumber = null;
    this.nextMoveTime = null;
    this.players.map(player => (player.nowMoving = false));
    this.winner = winner;

    // Update final scores before saving
    this.updatePlayerScores();

    this.save();
};

RoomSchema.methods.getWinner = function () {
    if (this.pawns.filter(pawn => pawn.color === 'red' && pawn.position === 73).length === 4) {
        return 'red';
    }
    if (this.pawns.filter(pawn => pawn.color === 'blue' && pawn.position === 79).length === 4) {
        return 'blue';
    }
    if (this.pawns.filter(pawn => pawn.color === 'green' && pawn.position === 85).length === 4) {
        return 'green';
    }
    if (this.pawns.filter(pawn => pawn.color === 'yellow' && pawn.position === 91).length === 4) {
        return 'yellow';
    }
    return null;
};

RoomSchema.methods.isFull = function () {
    if (this.players.length === 4) {
        this.full = true;
    }
    return this.full;
};

RoomSchema.methods.getPlayer = function (playerId) {
    return this.players.find(player => player._id.toString() === playerId.toString());
};

RoomSchema.methods.addPlayer = function (name, id) {
    if (this.full) return;
    this.players.push({
        sessionID: id,
        name: name,
        ready: false,
        color: COLORS[this.players.length],
    });
};

RoomSchema.methods.getPawnIndex = function (pawnId) {
    return this.pawns.findIndex(pawn => pawn._id.toString() === pawnId.toString());
};

RoomSchema.methods.getPawn = function (pawnId) {
    return this.pawns.find(pawn => pawn._id.toString() === pawnId.toString());
};

RoomSchema.methods.getPlayerPawns = function (color) {
    return this.pawns.filter(pawn => pawn.color === color);
};

RoomSchema.methods.getCurrentlyMovingPlayer = function () {
    return this.players.find(player => player.nowMoving === true);
};

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
