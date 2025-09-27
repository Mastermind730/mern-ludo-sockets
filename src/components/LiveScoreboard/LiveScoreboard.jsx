import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from '../../App';
import styles from './LiveScoreboard.module.css';

const LiveScoreboard = ({ players, roomData }) => {
    const socket = useContext(SocketContext);
    const [scores, setScores] = useState({
        playerScores: { red: 0, blue: 0, green: 0, yellow: 0 },
        captureCount: { red: 0, blue: 0, green: 0, yellow: 0 },
        pawnScores: {},
    });

    useEffect(() => {
        if (!socket) return;

        const handleScoreUpdate = scoreData => {
            try {
                const parsedData = JSON.parse(scoreData);
                setScores(parsedData);
            } catch (error) {
                console.error('Error parsing score data:', error);
            }
        };

        socket.on('game:scores', handleScoreUpdate);

        return () => {
            socket.off('game:scores', handleScoreUpdate);
        };
    }, [socket]);

    // Calculate scores from room data as fallback when backend events aren't working
    useEffect(() => {
        if (!roomData || !roomData.pawns) return;

        const colors = ['red', 'blue', 'green', 'yellow'];
        const newPlayerScores = {};
        let newCaptureCount = { red: 0, blue: 0, green: 0, yellow: 0 };

        colors.forEach(color => {
            const playerPawns = roomData.pawns.filter(pawn => pawn.color === color);
            newPlayerScores[color] = playerPawns.reduce((sum, pawn) => sum + (pawn.score || 0), 0);
        });

        // Use room data capture count if available
        if (roomData.captureCount) {
            newCaptureCount = { ...roomData.captureCount };
        }

        setScores(prevScores => ({
            ...prevScores,
            playerScores: newPlayerScores,
            captureCount: newCaptureCount,
        }));
    }, [roomData]);

    const getPlayerName = color => {
        const player = players.find(p => p.color === color);
        return player && player.name !== '...' ? player.name : color.charAt(0).toUpperCase() + color.slice(1);
    };

    const sortedPlayers = ['red', 'blue', 'green', 'yellow'].sort((a, b) => {
        return (scores.playerScores[b] || 0) - (scores.playerScores[a] || 0);
    });

    return (
        <div className={styles.scoreboard}>
            <div className={styles.header}>
                <h3>🏆 Live Scores</h3>
            </div>

            <div className={styles.scoreList}>
                {sortedPlayers.map((color, index) => {
                    const playerName = getPlayerName(color);
                    const score = scores.playerScores[color] || 0;
                    const captures = scores.captureCount[color] || 0;

                    // Only show players that are actually in the game
                    const player = players.find(p => p.color === color);
                    if (!player || player.name === '...') return null;

                    return (
                        <div
                            key={color}
                            className={`${styles.playerRow} ${styles[color]} ${index === 0 ? styles.leader : ''}`}
                        >
                            <div className={styles.playerInfo}>
                                <div className={styles.colorIndicator} style={{ backgroundColor: color }} />
                                <span className={styles.playerName}>
                                    {index === 0 && score > 0 && '👑 '}
                                    {playerName}
                                </span>
                            </div>

                            <div className={styles.scoreInfo}>
                                <div className={styles.mainScore}>
                                    <span className={styles.scoreValue}>{score}</span>
                                    <span className={styles.scoreLabel}>pts</span>
                                </div>
                                {captures > 0 && (
                                    <div className={styles.captures}>
                                        <span className={styles.captureIcon}>⚔️</span>
                                        <span className={styles.captureCount}>{captures}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.footer}>
                <small>Scores update in real-time</small>
            </div>
        </div>
    );
};

export default LiveScoreboard;
