import { useEffect, useRef } from 'react';
import { useScoring } from '../contexts/ScoringContext';
import useSocketData from './useSocketData';

const useScoringSystem = (pawns, socket, context) => {
    const scoring = useScoring();
    const previousPawnsRef = useRef({});
    const initializedRef = useRef(false);
    const [rolledNumber] = useSocketData('game:roll');

    // Initialize scoring when pawns are first loaded
    useEffect(() => {
        if (pawns.length === 16 && !initializedRef.current) {
            scoring.initializeGame(pawns);

            // Store initial positions for comparison
            const initialPositions = {};
            pawns.forEach(pawn => {
                initialPositions[pawn._id] = pawn.position;
            });
            previousPawnsRef.current = initialPositions;
            initializedRef.current = true;
        }
    }, [pawns, scoring]);

    // Track pawn movements and captures
    useEffect(() => {
        if (!initializedRef.current || pawns.length === 0) return;

        const currentPositions = {};
        pawns.forEach(pawn => {
            currentPositions[pawn._id] = pawn.position;
        });

        // Detect movements and captures
        pawns.forEach(pawn => {
            const previousPosition = previousPawnsRef.current[pawn._id];
            const currentPosition = pawn.position;

            // Check if pawn moved
            if (previousPosition !== undefined && previousPosition !== currentPosition) {
                // Calculate steps moved (for scoring)
                let stepsMoved = 0;

                // Use the rolled number as the score gain (this is the dice value)
                if (previousPosition === pawn.basePos && currentPosition !== pawn.basePos) {
                    // Moving out of base: use rolled dice value (typically 1 or 6)
                    stepsMoved = rolledNumber || 1;
                } else if (previousPosition !== pawn.basePos && currentPosition !== pawn.basePos) {
                    // Regular movement: use rolled dice value
                    stepsMoved = rolledNumber || calculateStepsMoved(pawn, previousPosition, currentPosition);
                }

                // Update pawn score if it moved
                if (stepsMoved > 0) {
                    scoring.updatePawnScore(pawn._id, stepsMoved, pawn.color, pawns);
                }
            }
        });

        // Check for captures by detecting pawns that returned to base
        const capturedPawns = pawns.filter(pawn => {
            const previousPosition = previousPawnsRef.current[pawn._id];
            return (
                previousPosition !== undefined && previousPosition !== pawn.basePos && pawn.position === pawn.basePos
            );
        });

        if (capturedPawns.length > 0) {
            // Find the pawn that likely caused the capture (last moved pawn not at base)
            const movingPawn = pawns.find(pawn => {
                const previousPosition = previousPawnsRef.current[pawn._id];
                return (
                    previousPosition !== undefined &&
                    previousPosition !== pawn.position &&
                    pawn.position !== pawn.basePos &&
                    capturedPawns.every(captured => captured.color !== pawn.color)
                );
            });

            if (movingPawn) {
                const victimIds = capturedPawns.map(pawn => pawn._id);
                scoring.handleCapture(movingPawn._id, victimIds, movingPawn.color, pawns);
            }
        }

        // Update reference for next comparison
        previousPawnsRef.current = currentPositions;
    }, [pawns, scoring, rolledNumber]);

    // Helper function to calculate steps moved
    const calculateStepsMoved = (pawn, previousPosition, currentPosition) => {
        // For simplicity, we'll use the difference in positions
        // This could be enhanced to handle the circular board logic
        if (currentPosition > previousPosition) {
            return currentPosition - previousPosition;
        } else {
            // Handle wrap-around or special board logic
            return 1; // Default to 1 step for complex moves
        }
    };

    // Listen for game end events
    useEffect(() => {
        if (socket) {
            const handleGameWinner = winner => {
                scoring.setGameEnd(winner);
            };

            socket.on('game:winner', handleGameWinner);

            return () => {
                socket.off('game:winner', handleGameWinner);
            };
        }
    }, [socket, scoring]);

    // Listen for timer-based game end (when timer runs out)
    useEffect(() => {
        if (socket) {
            const handleTimerEnd = () => {
                // When timer ends, determine winner by score
                const scoreWinner = scoring.getScoreBasedWinner();
                scoring.setGameEnd(scoreWinner);

                // Emit custom event to indicate timer-based win
                socket.emit('game:timer-end', { winner: scoreWinner });
            };

            socket.on('game:timer-end', handleTimerEnd);

            return () => {
                socket.off('game:timer-end', handleTimerEnd);
            };
        }
    }, [socket, scoring]);

    return {
        pawnScores: scoring.pawnScores,
        playerScores: scoring.playerScores,
        captureCount: scoring.captureCount,
        gameEnded: scoring.gameEnded,
        winner: scoring.winner,
        getScoreBasedWinner: scoring.getScoreBasedWinner,
    };
};

export default useScoringSystem;
