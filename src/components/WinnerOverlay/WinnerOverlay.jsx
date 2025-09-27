import React from 'react';
import styles from './WinnerOverlay.module.css';
import trophyImage from '../../images/trophy.webp';

const WinnerOverlay = ({ winner, scoringData, players, onPlayAgain }) => {
    if (!winner || !scoringData) return null;

    const { playerScores, captureCount } = scoringData;

    // Sort players by score for leaderboard
    const sortedPlayers = players
        .filter(player => player.name !== '...')
        .sort((a, b) => {
            const scoreA = playerScores[a.color] || 0;
            const scoreB = playerScores[b.color] || 0;

            if (scoreA !== scoreB) {
                return scoreB - scoreA; // Higher score first
            }

            // Tie-breaker: more captures
            const capturesA = captureCount[a.color] || 0;
            const capturesB = captureCount[b.color] || 0;
            return capturesB - capturesA;
        });

    const winnerPlayer = sortedPlayers.find(player => player.color === winner);

    return (
        <div className={styles.winnerContainer}>
            <div className={styles.trophySection}>
                <img src={trophyImage} alt='winner trophy' className={styles.trophy} />
                <h1 className={styles.winnerTitle}>🎉 Game Over! 🎉</h1>
                <h2 className={styles.winnerName}>
                    Winner: <span style={{ color: winner }}>{winnerPlayer?.name || winner}</span>
                </h2>
                <div className={styles.winnerStats}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Final Score:</span>
                        <span className={styles.statValue}>{playerScores[winner] || 0}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>Captures:</span>
                        <span className={styles.statValue}>{captureCount[winner] || 0}</span>
                    </div>
                </div>
            </div>

            <div className={styles.leaderboard}>
                <h3 className={styles.leaderboardTitle}>Final Leaderboard</h3>
                <div className={styles.leaderboardList}>
                    {sortedPlayers.map((player, index) => (
                        <div
                            key={player.color}
                            className={`${styles.leaderboardItem} ${player.color === winner ? styles.winner : ''}`}
                        >
                            <div className={styles.position}>#{index + 1}</div>
                            <div className={styles.playerInfo}>
                                <div className={styles.playerColorBadge} style={{ backgroundColor: player.color }}>
                                    {player.color?.charAt(0).toUpperCase()}
                                </div>
                                <span className={styles.playerName}>{player.name}</span>
                            </div>
                            <div className={styles.playerStats}>
                                <div className={styles.score}>Score: {playerScores[player.color] || 0}</div>
                                <div className={styles.captures}>Captures: {captureCount[player.color] || 0}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.actions}>
                <button className={styles.playAgainButton} onClick={onPlayAgain}>
                    Play Again
                </button>
            </div>
        </div>
    );
};

export default WinnerOverlay;
