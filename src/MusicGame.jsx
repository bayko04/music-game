import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import * as Tone from 'tone';

const MusicGame = () => {
  const gameRef = useRef(null);

  useEffect(() => {
    const synth = new Tone.Synth().toDestination();
    const notes = ['C4', 'E4', 'G4', 'B4']; // Ноты для дорожек

    let cursors;
    let tiles;

    // Конфигурация Phaser
    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 300 },
          debug: false
        }
      },
      scene: {
        preload: preload,
        create: create,
        update: update
      }
    };

    // Инициализация игры Phaser
    const game = new Phaser.Game(config);
    gameRef.current = game;

    function preload() {
      this.load.image('tile', 'path_to_tile_image.png'); // Загрузка изображения плитки
    }

    function create() {
      tiles = this.physics.add.group();

      // Создание плиток
      for (let i = 0; i < 4; i++) {
        const tile = tiles.create(200 * i + 100, 0, 'tile');
        tile.setInteractive();
        tile.on('pointerdown', () => playNote(i));
      }

      // Обработка нажатий клавиш
      cursors = this.input.keyboard.createCursorKeys();
    }

    function update() {
      // Падение плиток
      tiles.children.iterate(function (tile) {
        tile.y += 5; // скорость падения
        if (tile.y > 600) {
          tile.y = 0;
        }
      });

      // Обработка клавиш для каждой дорожки
      if (Phaser.Input.Keyboard.JustDown(cursors.left)) {
        playNote(0);
      } else if (Phaser.Input.Keyboard.JustDown(cursors.right)) {
        playNote(1);
      } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
        playNote(2);
      } else if (Phaser.Input.Keyboard.JustDown(cursors.down)) {
        playNote(3);
      }
    }

    // Функция для воспроизведения ноты
    function playNote(index) {
      synth.triggerAttackRelease(notes[index], '8n');
    }

    return () => {
      // Уничтожаем игру при размонтировании компонента
      if (gameRef.current) {
        gameRef.current.destroy(true);
      }
    };
  }, []);

  return <div id="game-container" />;
};

export default MusicGame;
