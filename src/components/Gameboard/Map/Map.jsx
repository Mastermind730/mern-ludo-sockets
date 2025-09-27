import React, { useEffect, useRef, useState, useContext } from 'react';
import { PlayerDataContext, SocketContext } from '../../../App';

import mapImage from '../../../images/map.jpg';
import positionMapCoords from '../positions';
import pawnImages from '../../../constants/pawnImages';
import canPawnMove from './canPawnMove';
import getPositionAfterMove from './getPositionAfterMove';

const Map = ({ pawns, nowMoving, rolledNumber }) => {
    const player = useContext(PlayerDataContext);
    const socket = useContext(SocketContext);
    const canvasRef = useRef(null);

    const [hintPawn, setHintPawn] = useState();

    const paintPawn = (context, pawn) => {
        if (!pawn || pawn.position === undefined || !positionMapCoords[pawn.position]) {
            return null;
        }

        const { x, y } = positionMapCoords[pawn.position];
        const touchableArea = new Path2D();
        touchableArea.arc(x, y, 12, 0, 2 * Math.PI);
        const image = new Image();
        image.src = pawnImages[pawn.color];
        image.onload = function () {
            context.drawImage(image, x - 17, y - 15, 35, 30);
        };
        return touchableArea;
    };

    const handleCanvasClick = event => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const cursorX = Math.round(event.clientX - rect.left);
        const cursorY = Math.round(event.clientY - rect.top);

        for (const pawn of pawns) {
            if (pawn.touchableArea && ctx.isPointInPath(pawn.touchableArea, cursorX, cursorY)) {
                if (canPawnMove(pawn, rolledNumber)) socket.emit('game:move', pawn._id);
            }
        }
        setHintPawn(null);
    };

    const handleMouseMove = event => {
        if (!nowMoving || !rolledNumber) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = Math.round(event.clientX - rect.left);
        const y = Math.round(event.clientY - rect.top);

        canvas.style.cursor = 'default';
        for (const pawn of pawns) {
            if (
                pawn.touchableArea &&
                ctx.isPointInPath(pawn.touchableArea, x, y) &&
                player.color === pawn.color &&
                canPawnMove(pawn, rolledNumber)
            ) {
                const pawnPosition = getPositionAfterMove(pawn, rolledNumber);
                if (pawnPosition) {
                    canvas.style.cursor = 'pointer';
                    if (hintPawn && hintPawn.id === pawn._id) return;
                    setHintPawn({ id: pawn._id, position: pawnPosition, color: 'grey' });
                    return;
                }
            }
        }
        setHintPawn(null);
    };

    useEffect(() => {
        const rerenderCanvas = () => {
            const canvas = canvasRef.current;
            if (!canvas || !pawns || pawns.length === 0) return;

            const ctx = canvas.getContext('2d');
            const image = new Image();
            image.src = mapImage;
            image.onload = function () {
                ctx.drawImage(image, 0, 0);
                pawns.forEach((pawn, index) => {
                    if (pawn && pawn.position !== undefined) {
                        const touchableArea = paintPawn(ctx, pawn);
                        if (touchableArea) {
                            pawns[index].touchableArea = touchableArea;
                        }
                    }
                });
                if (hintPawn) {
                    paintPawn(ctx, hintPawn);
                }
            };
        };
        rerenderCanvas();
    }, [hintPawn, pawns]);

    return (
        <canvas
            className='canvas-container'
            width={460}
            height={460}
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
        />
    );
};
export default Map;
