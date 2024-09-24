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
    let tileSpawnInterval = 500; // Интервал для создания плиток (меняется в зависимости от ритма)
    let lastDoubleTileTime = 0; // Время последнего создания двойных плиток
    const doubleTileCooldown = 1500; // Задержка 3 секунды для выпуска двойных плиток

    const meter = new Tone.Meter();
    const fft = new Tone.FFT(32); // Анализатор с 32 частотными полосами
    const threshold = -12; // Порог громкости для выпуска двойных плиток
    const spikeThreshold = 0.8; // Порог для обнаружения резких всплесков громкости

    const backgroundMusic = new Tone.Player({
      url: music,
      loop: false,
      autostart: false,
    }).toDestination();

    backgroundMusic.connect(meter);
    backgroundMusic.connect(fft); // Подключаем анализатор частот

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
        silenceDuration = Date.now();
      };

      backgroundMusic.onstart = () => {
        isMusicPlaying = true;
        const endOfSilence = Date.now();
        const silenceTimeElapsed = endOfSilence - silenceDuration;
        silenceDuration = silenceTimeElapsed;
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
      let beatInterval = (60 / bpm) * 1000;

      // Таймер для проверки ритма и изменения частоты плиток
      this.time.addEvent({
        delay: beatInterval,
        callback: () => adjustTileSpawnBasedOnRhythm(),
        callbackScope: this,
        loop: true,
      });

      // Спавн плиток на основе текущего интервала
      this.time.addEvent({
        delay: tileSpawnInterval,
        callback: () => spawnTileFromMelody(this, bpm),
        callbackScope: this,
        loop: true,
      });
    }

    // Функция для проверки изменения ритма
    function adjustTileSpawnBasedOnRhythm() {
      const currentBPM = Tone.Transport.bpm.value;

      if (currentBPM > 180) {
        // Если такт увеличивается, уменьшаем интервал между плитками
        tileSpawnInterval = 300; // Быстрая генерация плиток
      } else if (currentBPM > 120) {
        tileSpawnInterval = 400; // Средний темп
      } else {
        tileSpawnInterval = 500; // Медленный темп
      }
    }

    // Спавн плиток на основе мелодии и всплесков
    function spawnTileFromMelody(scene, bpm) {
      if (activeTiles >= 4) return;

      const level = meter.getValue();
      const fftValues = fft.getValue();
      const isFastBeat = bpm >= 180;
      const currentTime = Date.now();

      const availableLines = tileLines.filter(
        (_, index) => index !== lastUsedLine
      );

      const createTiles = () => {
        const x1 = Phaser.Math.RND.pick(availableLines);

        const createTile = (x) => {
          const tile = tiles.create(x, -tileHeight / 2, "tile");

          tile.setDisplaySize(tileWidth, tileHeight);
          tile.setInteractive();

          tile.on("pointerdown", (pointer) => {
            if (pointer.isDown) {
              setScore((prevScore) => prevScore + 10);
              tile.destroy();
              activeTiles--;
            }
          });

          tile.setDepth(1);
          activeTiles++;
        };

        createTile(x1);

        // Проверка на возможность появления двойных плиток
        if (
          level > threshold &&
          currentTime - lastDoubleTileTime > doubleTileCooldown
        ) {
          const availableLinesForSecondTile = availableLines.filter(
            (line) => line !== x1
          );
          const x2 = Phaser.Math.RND.pick(availableLinesForSecondTile);
          createTile(x2);

          // Обновляем время последнего создания двойных плиток
          lastDoubleTileTime = currentTime;
        }

        // Проверка на всплески громкости
        const maxSpike = Math.max(...fftValues.map((value) => value / 100));
        if (
          maxSpike > spikeThreshold &&
          currentTime - lastDoubleTileTime > doubleTileCooldown
        ) {
          const availableLinesForSpikeTile = availableLines.filter(
            (line) => line !== x1
          );
          if (availableLinesForSpikeTile.length > 0) {
            const x3 = Phaser.Math.RND.pick(availableLinesForSpikeTile);
            createTile(x3);
          }
        }

        lastUsedLine = tileLines.indexOf(x1);
      };

      scene.time.addEvent({
        delay: 0,
        callback: createTiles,
        callbackScope: scene,
      });
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
