var states = require('./states');
window.game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO);

states();
game.state.start('boot');

