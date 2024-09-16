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
      tileLines = [screenWidth * 0.3, screenWidth * 0.5, screenWidth * 0.7];
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
    const kick = new Tone.MembraneSynth().toDestination();
    const bass = new Tone.MonoSynth().toDestination();
    const snare = new Tone.NoiseSynth().toDestination();

    // const tileSound = new Tone.Player(tileSoundMp).toDestination();
    // tileSound.volume.value = -10;

    const melody = [
      { note: "E4", instrument: "synth", time: 0 },
      { note: "D4", instrument: "synth", time: "0:1" },
      { note: "C4", instrument: "bass", time: "0:2" },
      { note: "D4", instrument: "bass", time: "0:3" },
      { note: "E4", instrument: "synth", time: "1:0" },
      { note: "E2", instrument: "kick", time: "1:1" },
    ];

    let tiles;
    let hitZones;
    let tileSpeed = 12;
    let activeTiles = 0;
    const maxTiles = 4;

    const backgroundMusic = new Tone.Player({
      url: tileSoundMp,
      loop: false,
      autostart: false,
    }).toDestination();

    const stopGame = () => {
      setIsGameFinished(true);
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
      backgroundMusic.stop(); // Останавливаем музыку
      Tone.Transport.stop(); // Останавливаем транспорт
    };

    Tone.loaded().then(() => {
      Tone.Transport.start();
      backgroundMusic.start();

      // Останавливаем игру и музыку через 60 секунд
      setTimeout(() => {
        backgroundMusic.stop(); // Останавливаем музыку
        Tone.Transport.stop(); // Останавливаем транспорт
        stopGame(); // Завершаем игру
      }, 60000); // 60 секунд
    });

    const tempo = Tone.Transport.bpm.value;
    const beatInterval = (60 / tempo) * 1000;

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

      tileLines.forEach((linePos) => {
        lines.moveTo(linePos, 0);
        lines.lineTo(linePos, height);
      });
      lines.strokePath();

      tiles = this.physics.add.group();

      // Создание зон для нажатий
      hitZones = this.add.group();
      tileLines.forEach((xPos) => {
        const zone = this.add.rectangle(
          xPos,
          height - tileHeight - 50,
          tileWidth - 10,
          tileHeight - 50,
          0xffffff,
          0.1
        );
        hitZones.add(zone);
      });

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

      const x = Phaser.Math.RND.pick(tileLines);
      const tile = tiles.create(x, -50, "tile");

      tile.setInteractive();
      tile.note = noteObj.note;
      tile.instrument = noteObj.instrument;
      tile.on("pointerdown", (pointer) => {
        const clickedZone = hitZones.getChildren().find((zone) => {
          return (
            pointer.x >= zone.x - zone.width / 2 &&
            pointer.x <= zone.x + zone.width / 2 &&
            pointer.y >= zone.y - zone.height / 2 &&
            pointer.y <= zone.y + zone.height / 2
          );
        });

        if (clickedZone) {
          // playTileSound();
          setScore((prevScore) => prevScore + 10);
          tile.destroy();
          activeTiles--;
        }
      });

      tile.setDepth(1);
      tile.setDisplaySize(tileWidth, tileHeight);

      activeTiles++;
    }

    function update() {
      tiles.children.iterate(function (tile) {
        if (tile) {
          tile.y += tileSpeed;

          if (tile.y > height) {
            setScore((prevScore) => (prevScore - 5 > 0 ? prevScore - 5 : 0));
            tile.destroy();
            activeTiles--;
          }
        }
      });

      tileSpeed += 0.001; // Постепенное увеличение скорости
    }

    // function playTileSound() {
    //   tileSound.start();
    // }

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
    <div className="game-parent">
      {!isGameStarted && !isGameFinished && (
        <div className="start-button">
          <button onClick={handleStartGame}>Начать игру</button>
        </div>
      )}

      {isGameStarted && !isGameFinished && (
        <>
          <div id="game-container"></div>
          <div className="bg-blur"></div>
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
          <a onClick={() => setIsGameStarted(false)}>Вернуться</a>
        </div>
      )}
    </div>
  );
};

export default MusicTilesGame;
