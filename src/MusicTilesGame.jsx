import React, { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import * as Tone from "tone";
import musicMp from "./1.mp3";
import tileSoundMp from "./2.mp3";
import car1 from "./1.png";

const MusicTilesGame = () => {
  const gameRef = useRef(null);
  const [score, setScore] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);

  // Функция для динамического изменения конфигурации игры в зависимости от ширины экрана
  const getGameConfig = (screenWidth, screenHeight) => {
    let tileWidth, tileHeight, tileLines;

    if (screenWidth <= 480) {
      // Мобильные устройства
      tileWidth = 75;
      tileHeight = 150;
      tileLines = [screenWidth / 4, screenWidth / 2, (3 * screenWidth) / 4]; // Линии по ширине экрана
    } else if (screenWidth <= 768) {
      // Планшеты
      tileWidth = 100;
      tileHeight = 200;
      tileLines = [screenWidth / 4, screenWidth / 2, (3 * screenWidth) / 4];
    } else {
      // Десктопы
      tileWidth = 120;
      tileHeight = 240;
      tileLines = [screenWidth / 4, screenWidth / 2, (3 * screenWidth) / 4];
    }

    return {
      width: screenWidth,
      height: screenHeight,
      tileWidth,
      tileHeight,
      tileLines, // Линии для размещения плиток
    };
  };

  useEffect(() => {
    if (!isGameStarted) return;

    const synth = new Tone.Synth().toDestination();
    const kick = new Tone.MembraneSynth().toDestination();
    const bass = new Tone.MonoSynth().toDestination();
    const snare = new Tone.NoiseSynth().toDestination();

    const tileSound = new Tone.Player(tileSoundMp).toDestination();
    tileSound.volume.value = -10;

    const melody = [
      { note: "E4", instrument: "synth", time: 0 },
      { note: "D4", instrument: "synth", time: "0:1" },
      { note: "C4", instrument: "bass", time: "0:2" },
      { note: "D4", instrument: "bass", time: "0:3" },
      { note: "E4", instrument: "synth", time: "1:0" },
      { note: "E2", instrument: "kick", time: "1:1" },
    ];

    let tiles;
    let tileSpeed = 10;
    let activeTiles = 0;
    const maxTiles = 4;

    const backgroundMusic = new Tone.Player({
      url: tileSoundMp,
      loop: false,
      autostart: false,
    }).toDestination();

    const stopGame = () => {
      setIsGameFinished(true); // Игра окончена
      if (gameRef.current) {
        gameRef.current.destroy(true); // Очищаем игру
      }
      backgroundMusic.stop();
      Tone.Transport.stop();
    };

    Tone.loaded().then(() => {
      Tone.Transport.start();
      backgroundMusic.start();

      // Таймер на 60 секунд для остановки игры
      setTimeout(() => {
        stopGame(); // Останавливаем игру и музыку через 1 минуту
      }, 60000);
    });

    const tempo = Tone.Transport.bpm.value;
    const beatInterval = (60 / tempo) * 1000;

    // Получение текущей конфигурации игры на основе ширины экрана
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
      lines.lineStyle(2, 0xffffff);

      // Динамическое создание линий на основе ширины экрана
      tileLines.forEach((linePos) => {
        lines.moveTo(linePos, 0);
        lines.lineTo(linePos, height);
      });
      lines.strokePath();

      tiles = this.physics.add.group();

      this.time.addEvent({
        delay: beatInterval,
        callback: spawnTileFromMelody,
        callbackScope: this,
        loop: true,
      });
    }

    function spawnTileFromMelody() {
      const nextNote = melody.shift();
      if (nextNote) {
        spawnTile(nextNote);
        melody.push(nextNote);
      }
    }

    function spawnTile(noteObj) {
      if (activeTiles >= maxTiles) return;

      // Динамическое размещение плиток на основе ширины экрана
      const x = Phaser.Math.RND.pick(tileLines);
      const tile = tiles.create(x, -50, "tile");

      tile.setInteractive();
      tile.note = noteObj.note;
      tile.instrument = noteObj.instrument;
      tile.on("pointerdown", () => {
        playTileSound();
        setScore((prevScore) => prevScore + 10);
        tile.destroy();
        activeTiles--;
      });

      tile.setDepth(1);
      tile.setDisplaySize(tileWidth, tileHeight); // Установка динамического размера плиток

      activeTiles++;
    }

    function update() {
      tiles.children.iterate(function (tile) {
        if (tile) {
          tile.y += tileSpeed;

          if (tile.y > height) {
            setScore((prevScore) => prevScore - 5);
            tile.destroy();
            activeTiles--;
          }
        }
      });

      tileSpeed += 0.001;
    }

    function playTileSound() {
      tileSound.start();
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
    setIsGameStarted(true);
    setIsGameFinished(false);
  };

  return (
    <div className="game-parent" style={{ width: "100vw", height: "100vh" }}>
      {!isGameStarted && !isGameFinished && (
        <div className="start-button">
          <button onClick={handleStartGame}>Начать игру</button>
        </div>
      )}

      {isGameStarted && !isGameFinished && (
        <>
          <div id="game-container"></div>
          <h1 className="game-points">
            <span>{score}</span>
            <br />
            POINTS
          </h1>
        </>
      )}

      {isGameFinished && (
        <div className="end-screen">
          <h3>Игра окончена!</h3>
          <button onClick={() => setIsGameStarted(false)}>Вернуться</button>
        </div>
      )}
    </div>
  );
};

export default MusicTilesGame;
