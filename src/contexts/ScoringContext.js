import React, { createContext, useContext, useReducer } from 'react';

const ScoringContext = createContext();

// Action types for the scoring reducer
const SCORING_ACTIONS = {
    INITIALIZE_GAME: 'INITIALIZE_GAME',
    UPDATE_PAWN_SCORE: 'UPDATE_PAWN_SCORE',
    HANDLE_CAPTURE: 'HANDLE_CAPTURE',
    RESET_SCORES: 'RESET_SCORES',
    SET_GAME_END: 'SET_GAME_END',
};

// Initial scoring state
const initialState = {
    pawnScores: {}, // { pawnId: score }
    playerScores: { red: 0, blue: 0, green: 0, yellow: 0 },
    captureCount: { red: 0, blue: 0, green: 0, yellow: 0 },
    gameEnded: false,
    winner: null,
};

// Scoring reducer function
function scoringReducer(state, action) {
    switch (action.type) {
        case SCORING_ACTIONS.INITIALIZE_GAME: {
            const { pawns } = action.payload;
            const pawnScores = {};

            // Initialize all pawns with 0 score
            pawns.forEach(pawn => {
                pawnScores[pawn._id] = 0;
            });

            return {
                ...initialState,
                pawnScores,
            };
        }

        case SCORING_ACTIONS.UPDATE_PAWN_SCORE: {
            const { pawnId, stepsMoved, pawnColor } = action.payload;
            const newPawnScores = {
                ...state.pawnScores,
                [pawnId]: (state.pawnScores[pawnId] || 0) + stepsMoved,
            };

            // Calculate new player score for the affected player
            const newPlayerScores = { ...state.playerScores };
            newPlayerScores[pawnColor] = Object.keys(newPawnScores)
                .filter(id => action.payload.pawns.find(p => p._id === id)?.color === pawnColor)
                .reduce((sum, id) => sum + newPawnScores[id], 0);

            return {
                ...state,
                pawnScores: newPawnScores,
                playerScores: newPlayerScores,
            };
        }

        case SCORING_ACTIONS.HANDLE_CAPTURE: {
            const { strikerPawnId, victimPawnIds, strikerColor, pawns } = action.payload;
            let newPawnScores = { ...state.pawnScores };
            let newCaptureCount = { ...state.captureCount };

            // Calculate total victim scores
            let totalVictimScore = 0;
            victimPawnIds.forEach(victimId => {
                totalVictimScore += newPawnScores[victimId] || 0;
                newPawnScores[victimId] = 0; // Reset victim scores
            });

            // Add victim scores to striker
            newPawnScores[strikerPawnId] = (newPawnScores[strikerPawnId] || 0) + totalVictimScore;

            // Increment capture count for striker's color
            newCaptureCount[strikerColor] = (newCaptureCount[strikerColor] || 0) + victimPawnIds.length;

            // Recalculate player scores for all affected players
            const newPlayerScores = { ...state.playerScores };
            const affectedColors = new Set([strikerColor]);
            victimPawnIds.forEach(victimId => {
                const victimPawn = pawns.find(p => p._id === victimId);
                if (victimPawn) affectedColors.add(victimPawn.color);
            });

            affectedColors.forEach(color => {
                newPlayerScores[color] = Object.keys(newPawnScores)
                    .filter(id => pawns.find(p => p._id === id)?.color === color)
                    .reduce((sum, id) => sum + newPawnScores[id], 0);
            });

            return {
                ...state,
                pawnScores: newPawnScores,
                playerScores: newPlayerScores,
                captureCount: newCaptureCount,
            };
        }

        case SCORING_ACTIONS.SET_GAME_END: {
            const { winner } = action.payload;
            return {
                ...state,
                gameEnded: true,
                winner,
            };
        }

        case SCORING_ACTIONS.RESET_SCORES: {
            return initialState;
        }

        default:
            return state;
    }
}

// Scoring context provider
export const ScoringProvider = ({ children }) => {
    const [state, dispatch] = useReducer(scoringReducer, initialState);

    // Helper function to initialize the game
    const initializeGame = pawns => {
        dispatch({
            type: SCORING_ACTIONS.INITIALIZE_GAME,
            payload: { pawns },
        });
    };

    // Helper function to update pawn score after movement
    const updatePawnScore = (pawnId, stepsMoved, pawnColor, pawns) => {
        dispatch({
            type: SCORING_ACTIONS.UPDATE_PAWN_SCORE,
            payload: { pawnId, stepsMoved, pawnColor, pawns },
        });
    };

    // Helper function to handle captures
    const handleCapture = (strikerPawnId, victimPawnIds, strikerColor, pawns) => {
        dispatch({
            type: SCORING_ACTIONS.HANDLE_CAPTURE,
            payload: { strikerPawnId, victimPawnIds, strikerColor, pawns },
        });
    };

    // Helper function to set game end
    const setGameEnd = winner => {
        dispatch({
            type: SCORING_ACTIONS.SET_GAME_END,
            payload: { winner },
        });
    };

    // Helper function to reset scores
    const resetScores = () => {
        dispatch({
            type: SCORING_ACTIONS.RESET_SCORES,
        });
    };

    // Helper function to determine winner based on scores and captures
    const getScoreBasedWinner = () => {
        const scores = state.playerScores;
        const captures = state.captureCount;

        // Find max score
        const maxScore = Math.max(...Object.values(scores));
        const topPlayers = Object.keys(scores).filter(color => scores[color] === maxScore);

        // If tie, use capture count as tie-breaker
        if (topPlayers.length > 1) {
            const maxCaptures = Math.max(...topPlayers.map(color => captures[color]));
            const winnersByCaptures = topPlayers.filter(color => captures[color] === maxCaptures);
            return winnersByCaptures[0]; // Return first if still tied
        }

        return topPlayers[0];
    };

    const contextValue = {
        ...state,
        initializeGame,
        updatePawnScore,
        handleCapture,
        setGameEnd,
        resetScores,
        getScoreBasedWinner,
    };

    return <ScoringContext.Provider value={contextValue}>{children}</ScoringContext.Provider>;
};

// Custom hook to use scoring context
export const useScoring = () => {
    const context = useContext(ScoringContext);
    if (!context) {
        throw new Error('useScoring must be used within a ScoringProvider');
    }
    return context;
};

export default ScoringContext;
