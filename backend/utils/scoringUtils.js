/**
 * Scoring utility functions for the Ludo game
 */

// Calculate steps moved by a pawn based on dice value and position change
const calculateStepsMoved = (pawn, previousPosition, newPosition, rolledNumber) => {
    // If moving from base to start position
    if (previousPosition === pawn.basePos && newPosition !== pawn.basePos) {
        return rolledNumber || 1; // Use dice value or default to 1
    }

    // If both positions are on the board (not base)
    if (previousPosition !== pawn.basePos && newPosition !== pawn.basePos) {
        return rolledNumber || 1; // Use dice value for scoring
    }

    return 0;
};

// Update pawn score after movement
const updatePawnScore = (pawn, stepsMoved) => {
    pawn.score = (pawn.score || 0) + stepsMoved;
    return pawn.score;
};

// Handle capture scoring: transfer victim score to striker, reset victim
const handleCaptureScoring = (strikerPawn, victimPawns) => {
    let totalCapturedScore = 0;

    victimPawns.forEach(victim => {
        totalCapturedScore += victim.score || 0;
        victim.score = 0; // Reset victim score
    });

    // Add captured score to striker
    strikerPawn.score = (strikerPawn.score || 0) + totalCapturedScore;

    return {
        capturedScore: totalCapturedScore,
        newStrikerScore: strikerPawn.score,
        capturesCount: victimPawns.length,
    };
};

// Calculate total player score from all their pawns
const calculatePlayerScore = playerPawns => {
    return playerPawns.reduce((total, pawn) => total + (pawn.score || 0), 0);
};

// Get formatted score data for frontend
const getFormattedScores = room => {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const playerScores = {};
    const pawnScores = {};

    colors.forEach(color => {
        const playerPawns = room.getPlayerPawns(color);
        playerScores[color] = calculatePlayerScore(playerPawns);

        // Individual pawn scores
        playerPawns.forEach(pawn => {
            if (pawn.score > 0) {
                pawnScores[pawn._id.toString()] = pawn.score;
            }
        });
    });

    return {
        playerScores,
        pawnScores,
        captureCount: room.captureCount || { red: 0, blue: 0, green: 0, yellow: 0 },
    };
};

// Determine winner based on highest score (with capture count as tie-breaker)
const getScoreBasedWinner = (playerScores, captureCount) => {
    const scores = Object.entries(playerScores);
    const maxScore = Math.max(...scores.map(([, score]) => score));
    const topPlayers = scores.filter(([, score]) => score === maxScore);

    if (topPlayers.length > 1) {
        // Use capture count as tie-breaker
        const maxCaptures = Math.max(...topPlayers.map(([color]) => captureCount[color] || 0));
        const winnersByCaptures = topPlayers.filter(([color]) => (captureCount[color] || 0) === maxCaptures);
        return winnersByCaptures[0][0]; // Return first if still tied
    }

    return topPlayers[0][0];
};

module.exports = {
    calculateStepsMoved,
    updatePawnScore,
    handleCaptureScoring,
    calculatePlayerScore,
    getFormattedScores,
    getScoreBasedWinner,
};
