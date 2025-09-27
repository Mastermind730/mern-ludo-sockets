const { sendToPlayersRolledNumber, sendWinner, sendScoreUpdate, sendFinalScores } = require('../socket/emits');

const rollDice = () => {
    const rolledNumber = Math.ceil(Math.random() * 6);
    return rolledNumber;
};

const makeRandomMove = async roomId => {
    const { updateRoom, getRoom } = require('../services/roomService');
    const room = await getRoom(roomId);
    if (room.winner) return;
    if (room.rolledNumber === null) {
        room.rolledNumber = rollDice();
        sendToPlayersRolledNumber(room._id.toString(), room.rolledNumber);
    }

    const pawnsThatCanMove = room.getPawnsThatCanMove();
    if (pawnsThatCanMove.length > 0) {
        const randomPawn = pawnsThatCanMove[Math.floor(Math.random() * pawnsThatCanMove.length)];
        room.movePawn(randomPawn);

        // Emit updated scores after random move
        const scoreData = room.getPlayerScores();
        sendScoreUpdate(room._id.toString(), scoreData);
    }
    room.changeMovingPlayer();
    const winner = room.getWinner();
    if (winner) {
        room.endGame(winner);
        // Send final scores along with winner
        const finalScores = room.getPlayerScores();
        sendFinalScores(room._id.toString(), finalScores);
        sendWinner(room._id.toString(), winner);
    }
    await updateRoom(room);
};

const isMoveValid = (session, pawn, room) => {
    if (session.color !== pawn.color) {
        return false;
    }
    if (session.playerId !== room.getCurrentlyMovingPlayer()._id.toString()) {
        return false;
    }
    return true;
};

module.exports = { rollDice, makeRandomMove, isMoveValid };
