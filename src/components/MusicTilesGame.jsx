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

    let tiles;
    let hitZones;
    let tileSpeed = 17;
    let activeTiles = 0;
    let lastUsedLine = null;
    let isMusicPlaying = true;
    let silenceDuration = 0;

    const meter = new Tone.Meter();
    const threshold = -12; // Порог громкости для выпуска двойных плиток

    const backgroundMusic = new Tone.Player({
      url: music,
      loop: false,
      autostart: false,
    }).toDestination();

    // Подключаем плеер к анализатору громкости
    backgroundMusic.connect(meter);

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

      backgroundMusic.onstop = () => {
        isMusicPlaying = false;
        silenceDuration = Date.now(); // Засекаем начало паузы
      };

      backgroundMusic.onstart = () => {
        isMusicPlaying = true;
        const endOfSilence = Date.now();
        const silenceTimeElapsed = endOfSilence - silenceDuration;
        silenceDuration = silenceTimeElapsed; // Сохраняем время паузы
      };

      setTimeout(() => {
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
      if (activeTiles >= 4) return;

      const level = meter.getValue(); // Получаем уровень громкости
      const isFastBeat = bpm >= 180;

      // Фильтруем доступные линии, чтобы исключить последнюю использованную линию
      const availableLines = tileLines.filter(
        (_, index) => index !== lastUsedLine
      );
      const x1 = Phaser.Math.RND.pick(availableLines); // Выбираем первую линию

      const createTile = (x) => {
        return new Promise((resolve) => {
          const tile = tiles.create(x, -tileHeight / 2, "tile");
          tile.setDisplaySize(tileWidth, tileHeight);
          tile.setInteractive();

          // Обработчик клика для каждой плитки
          tile.on("pointerdown", () => {
            setScore((prevScore) => prevScore + 10);
            tile.destroy();
            activeTiles--;
          });

          tile.setDepth(1);
          activeTiles++;

          resolve(tile); // Резолвим промис после создания плитки
        });
      };

      // Создаем первую плитку
      createTile(x1).then(() => {
        // Если уровень громкости выше порога или ритм быстрый, создаем дополнительную плитку
        if (level > threshold || isFastBeat) {
          const availableLinesForSecondTile = availableLines.filter(
            (line) => line !== x1
          );
          const x2 = Phaser.Math.RND.pick(availableLinesForSecondTile); // Выбираем вторую линию

          // Создаем вторую плитку
          createTile(x2);
        }
      });

      lastUsedLine = tileLines.indexOf(x1); // Запоминаем последнюю использованную линию
    }

    function update(time, delta) {
      tiles.children.iterate((tile) => {
        if (tile) {
          tile.y += tileSpeed;

          if (tile.y >= height) {
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
          {score} <br /> <span>POINTS</span>
        </div>
      )}
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
          Current Song: <br /> <span>{name}</span>
        </div>
      )}
    </div>
  );
};

export default MusicTilesGame;
