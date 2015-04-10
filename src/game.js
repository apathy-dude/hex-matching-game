var states = require('./states');

window.game = new Phaser.Game('100%', '100%', Phaser.AUTO, '', null, false, true, null);

states();
game.state.start('boot');

