import { useEffect, useRef, useCallback } from 'react';

const useTimerMonitor = (time, socket, scoringData) => {
    const timerRef = useRef(null);
    const gameEndedRef = useRef(false);

    const handleTimerEnd = useCallback(() => {
        if (gameEndedRef.current || !scoringData || !socket) return;

        gameEndedRef.current = true;

        // Determine winner by score
        const scoreWinner = scoringData.getScoreBasedWinner();

        // Emit timer end event to trigger score-based win
        socket.emit('game:timer-end', {
            winner: scoreWinner,
            reason: 'timer',
            finalScores: scoringData.playerScores,
            captures: scoringData.captureCount,
        });
    }, [socket, scoringData]);

    useEffect(() => {
        if (!time || !socket || !scoringData || gameEndedRef.current) return;

        // Clear any existing timer
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Calculate time until timer expires
        const timeUntilEnd = time - Date.now();

        if (timeUntilEnd <= 0) {
            // Timer already expired, trigger score-based win immediately
            handleTimerEnd();
            return;
        }

        // Set up timer to trigger when time runs out
        timerRef.current = setTimeout(() => {
            handleTimerEnd();
        }, timeUntilEnd);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [time, socket, scoringData, handleTimerEnd]);

    // Reset game ended flag when a new game starts
    useEffect(() => {
        if (!time) {
            gameEndedRef.current = false;
        }
    }, [time]);

    return { handleTimerEnd };
};

export default useTimerMonitor;
