import React, { useState, useEffect, useContext } from 'react';
import ReactLoading from 'react-loading';
import { PlayerDataContext, SocketContext } from '../../App';
import useSocketData from '../../hooks/useSocketData';
import useScoringSystem from '../../hooks/useScoringSystem';
import useTimerMonitor from '../../hooks/useTimerMonitor';
import Map from './Map/Map';
import Navbar from '../Navbar/Navbar';
import Overlay from '../Overlay/Overlay';
import LiveScoreboard from '../LiveScoreboard/LiveScoreboard';
import WinnerOverlay from '../WinnerOverlay/WinnerOverlay';

const Gameboard = () => {
    const socket = useContext(SocketContext);
    const context = useContext(PlayerDataContext);
    const [pawns, setPawns] = useState([]);
    const [players, setPlayers] = useState([]);

    const [rolledNumber, setRolledNumber] = useSocketData('game:roll');
    const [time, setTime] = useState();
    const [isReady, setIsReady] = useState();
    const [nowMoving, setNowMoving] = useState(false);
    const [started, setStarted] = useState(false);

    const [movingPlayer, setMovingPlayer] = useState('red');

    const [winner, setWinner] = useState(null);
    const [finalScores, setFinalScores] = useState(null);

    // Initialize scoring system
    const scoringData = useScoringSystem(pawns, socket, context);

    // Monitor timer for score-based wins
    useTimerMonitor(time, socket, scoringData);

    useEffect(() => {
        socket.emit('room:data', context.roomId);
        socket.on('room:data', data => {
            data = JSON.parse(data);
            if (data.players == null) return;
            // Filling navbar with empty player nick container
            while (data.players.length !== 4) {
                data.players.push({ name: '...' });
            }
            // Checks if client is currently moving player by session ID
            const nowMovingPlayer = data.players.find(player => player.nowMoving === true);
            if (nowMovingPlayer) {
                if (nowMovingPlayer._id === context.playerId) {
                    setNowMoving(true);
                } else {
                    setNowMoving(false);
                }
                setMovingPlayer(nowMovingPlayer.color);
            }
            const currentPlayer = data.players.find(player => player._id === context.playerId);
            setIsReady(currentPlayer.ready);
            setRolledNumber(data.rolledNumber);
            setPlayers(data.players);
            setPawns(data.pawns);
            setTime(data.nextMoveTime);
            setStarted(data.started);
        });

        socket.on('game:winner', winner => {
            setWinner(winner);
        });

        socket.on('game:timer-end', data => {
            // Handle timer-based game end with score winner
            setWinner(data.winner);
            if (data.finalScores) {
                setFinalScores(data.finalScores);
            }
        });

        // Listen for final score updates
        socket.on('game:final-scores', data => {
            setFinalScores(data);
        });
        socket.on('redirect', () => {
            window.location.reload();
        });
    }, [socket, context.playerId, context.roomId, setRolledNumber]);

    return (
        <>
            {pawns.length === 16 ? (
                <div className='container'>
                    <Navbar
                        players={players}
                        started={started}
                        time={time}
                        isReady={isReady}
                        movingPlayer={movingPlayer}
                        rolledNumber={rolledNumber}
                        nowMoving={nowMoving}
                        ended={winner !== null}
                        scoringData={scoringData}
                    />
                    <Map pawns={pawns} nowMoving={nowMoving} rolledNumber={rolledNumber} scoringData={scoringData} />
                    {started && <LiveScoreboard players={players} />}
                </div>
            ) : (
                <ReactLoading type='spinningBubbles' color='white' height={667} width={375} />
            )}
            {winner ? (
                <Overlay>
                    <WinnerOverlay
                        winner={winner}
                        players={players}
                        finalScores={finalScores}
                        onPlayAgain={() => socket.emit('player:exit')}
                    />
                </Overlay>
            ) : null}
        </>
    );
};

export default Gameboard;
