import React from 'react';
import styles from './ScoreDisplay.module.css';

const ScoreDisplay = ({ scoringData, players, currentPlayerColor, pawns }) => {
    if (!scoringData) return null;

    const { playerScores, captureCount, pawnScores } = scoringData;

    return (
        <div className={styles.scoreContainer}>
            <div className={styles.scoreHeader}>
                <h3>Game Scores</h3>
            </div>

            <div className={styles.playersGrid}>
                {players
                    .filter(player => player.name !== '...')
                    .map((player, index) => (
                        <div
                            key={player.color || index}
                            className={`${styles.playerScore} ${styles[player.color]} ${
                                currentPlayerColor === player.color ? styles.currentPlayer : ''
                            }`}
                        >
                            <div className={styles.playerInfo}>
                                <div className={styles.playerName}>{player.name}</div>
                                <div className={styles.playerColor} style={{ backgroundColor: player.color }}>
                                    {player.color?.toUpperCase()}
                                </div>
                            </div>

                            <div className={styles.scoreInfo}>
                                <div className={styles.totalScore}>
                                    <span className={styles.scoreLabel}>Score:</span>
                                    <span className={styles.scoreValue}>{playerScores[player.color] || 0}</span>
                                </div>

                                <div className={styles.captures}>
                                    <span className={styles.captureLabel}>Captures:</span>
                                    <span className={styles.captureValue}>{captureCount[player.color] || 0}</span>
                                </div>
                            </div>
                        </div>
                    ))}
            </div>

            <div className={styles.pawnScoresSection}>
                <h4>Individual Pawn Scores</h4>
                <div className={styles.pawnScoresGrid}>
                    {Object.entries(pawnScores).map(([pawnId, score]) => {
                        // Find the pawn to get its color from the pawns array
                        const pawn = pawns ? pawns.find(p => p._id === pawnId) : null;
                        const pawnColor = pawn ? pawn.color : getPawnColor(pawnId, players);
                        if (score === 0) return null; // Don't show pawns with 0 score

                        return (
                            <div key={pawnId} className={styles.pawnScore}>
                                <div className={styles.pawnIndicator} style={{ backgroundColor: pawnColor }}>
                                    P
                                </div>
                                <span className={styles.pawnScoreValue}>{score}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// Helper function to get pawn color (you might need to adjust this based on your pawn structure)
const getPawnColor = (pawnId, players) => {
    // This is a simplified approach - you might need to adjust based on your actual pawn ID structure
    const pawnIndex = parseInt(pawnId.slice(-1), 16) % 16;
    if (pawnIndex < 4) return 'red';
    if (pawnIndex < 8) return 'blue';
    if (pawnIndex < 12) return 'green';
    return 'yellow';
};

export default ScoreDisplay;
