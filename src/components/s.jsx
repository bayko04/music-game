import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import * as Tone from "tone";
import car1 from "../images/1.png"; // Изображение плитки
import { useDispatch, useSelector } from "react-redux";
import {
  setIsGameStarted,
  setMusic,
  setName,
} from "../store/reducers/GameSlice";

const MusicTilesGame = ({ songName }) => {
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  // const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const { isGameStarted, name, music } = useSelector((state) => state.game);
  const dispatch = useDispatch();

  const getGameConfig = (screenWidth, screenHeight) => {
    let tileWidth, tileHeight, tileLines;

    if (screenWidth <= 480) {
      tileWidth = 100;
      tileHeight = 200;
      tileLines = [screenWidth * 0.2, screenWidth * 0.5, screenWidth * 0.8];
    } else if (screenWidth <= 768) {
      tileWidth = 150;
      tileHeight = 300;
      tileLines = [screenWidth * 0.2, screenWidth * 0.5, screenWidth * 0.8];
    } else {
      tileWidth = 200;
      tileHeight = 400;
      tileLines = [screenWidth * 0.25, screenWidth * 0.5, screenWidth * 0.75];
    }

    return {
      width: screenWidth,
      height: screenHeight,
      tileWidth,
      tileHeight,
      tileLines,
    };
  };

  useEffect(() => {
    if (!isGameStarted) return;

    const synth = new Tone.Synth().toDestination();
    let tiles;
    let hitZones;
    let tileSpeed = 17;
    let activeTiles = 0;
    let lastTileWasLong = false;
    let lastUsedLine = null;
    const maxTiles = 4;

    const backgroundMusic = new Tone.Player({
      url: music,
      loop: false,
      autostart: false,
    }).toDestination();

    const stopGame = () => {
      setIsGameFinished(true);
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
      backgroundMusic.stop();
      Tone.Transport.stop();
    };

    Tone.loaded().then(() => {
      Tone.Transport.start();
      backgroundMusic.start();

      setTimeout(() => {
        backgroundMusic.stop();
        Tone.Transport.stop();
        stopGame();
      }, 60000);
    });

    const { width, height, tileWidth, tileHeight, tileLines } = getGameConfig(
      window.innerWidth,
      window.innerHeight
    );

    const config = {
      type: Phaser.AUTO,
      width: width,
      height: height,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    function preload() {
      this.load.image("tile", car1);
    }

    function create() {
      this.cameras.main.setBackgroundColor("#212121");

      const lines = this.add.graphics();
      lines.lineStyle(2, 0x4b4848);

      const midLines = [
        (tileLines[0] + tileLines[1]) / 2,
        (tileLines[1] + tileLines[2]) / 2,
      ];

      midLines.forEach((linePos) => {
        lines.moveTo(linePos, 0);
        lines.lineTo(linePos, height);
      });
      lines.strokePath();

      tiles = this.physics.add.group();

      hitZones = this.add.group();
      tileLines.forEach((xPos) => {
        const zoneGraphics = this.add.graphics();
        zoneGraphics.fillStyle(0xffffff, 0.1);

        zoneGraphics.fillRoundedRect(
          xPos - tileWidth / 2,
          height - tileHeight - 50,
          tileWidth,
          tileHeight - 50,
          12
        );

        hitZones.add(zoneGraphics);
      });

      const bpm = 120;
      const beatInterval = (60 / bpm) * 1000;

      this.time.addEvent({
        delay: beatInterval,
        callback: () => spawnTileFromMelody(bpm),
        callbackScope: this,
        loop: true,
      });
    }

    function spawnTileFromMelody(bpm) {
      let isLongTile = false;

      if (!lastTileWasLong) {
        const longTileProbability = bpm > 160 ? 0.2 : 0.5;
        isLongTile = Math.random() < longTileProbability;
      }

      let availableLines = tileLines.filter(
        (_, index) => index !== lastUsedLine
      );
      const x = Phaser.Math.RND.pick(availableLines);
      const newLineIndex = tileLines.indexOf(x);

      const tile = tiles.create(x, -tileHeight / 2, "tile");
      tile.setInteractive();
      tile.isLongTile = isLongTile;

      if (isLongTile) {
        // tile.setTint(0xff0000);
        tile.holdTime = 0;
        tile.requiredHoldTime = bpm * 10;
        tile.isBeingHeld = false;

        const randomHeights = [400, 600, 1200];
        const randomHeight = Phaser.Math.RND.pick(randomHeights);
        tile.setDisplaySize(tileWidth, randomHeight);

        tile.on("pointerdown", () => {
          tile.isBeingHeld = true;
          tile.setTint(0x00ff00);
        });

        tile.on("pointerup", () => {
          tile.isBeingHeld = false;
          const holdPercentage = Math.min(
            tile.holdTime / tile.requiredHoldTime,
            1
          );
          const points = Math.floor(holdPercentage * 100);
          setScore((prevScore) => prevScore + points);
          tile.destroy();
          activeTiles--;
        });

        tile.on("pointerout", () => {
          tile.isBeingHeld = false;
          tile.setTint(0xff0000);
        });

        lastTileWasLong = true;
      } else {
        tile.on("pointerdown", () => {
          setScore((prevScore) => prevScore + 10);
          tile.destroy();
          activeTiles--;
        });

        tile.setDisplaySize(tileWidth, tileHeight);
        lastTileWasLong = false;
      }

      tile.setDepth(1);
      activeTiles++;

      lastUsedLine = newLineIndex;
    }

    function update(time, delta) {
      tiles.children.iterate((tile) => {
        if (tile) {
          tile.y += tileSpeed;

          if (tile.isLongTile && tile.isBeingHeld) {
            tile.holdTime += delta;
          }

          if (!tile.isBeingHeld && tile.isLongTile && tile.y >= height) {
            tile.destroy();
            activeTiles--;
          }

          if (!tile.isLongTile && tile.y >= height) {
            setScore((prevScore) => Math.max(prevScore - 5, 0));
            tile.destroy();
            activeTiles--;
          }
        }
      });

      tileSpeed += 0.001;
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
      backgroundMusic.stop();
      Tone.Transport.stop();
    };
  }, [isGameStarted]);

  const handleStartGame = () => {
    dispatch(setName(songName));
    dispatch(setIsGameStarted(true));
    setIsGameFinished(false);
  };

  return (
    <div className="game-parent">
      {isGameStarted && (
        <div className="score-display">
          {score} <br /> <span>POINTS</span>{" "}
        </div>
      )}
      {/* Очки вверху */}
      {!isGameStarted && !isGameFinished && (
        <div className="start-button">
          <button onClick={handleStartGame}>{songName}</button>
        </div>
      )}
      {isGameFinished && (
        <div className="game-finished">
          <h2>Game Over</h2>
          <p>Score: {score}</p>
          <button onClick={() => dispatch(setIsGameStarted(false))}>
            Restart
          </button>
        </div>
      )}
      <div id="phaser-container" ref={gameRef} />
      {isGameStarted && (
        <div className="song-title">
          Current Song: <br /> <span>{songName}</span>
        </div>
      )}
      {/* Название песни внизу */}
    </div>
  );
};

export default MusicTilesGame;
