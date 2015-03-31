var states = require('./states');
window.game = new Phaser.Game(800, 600, Phaser.AUTO);

states();
game.state.start('boot');

