module.exports = {
    create: function() {
        var scale = game.scale;
        scale.scaleMode = Phaser.ScaleManager.RESIZE;
        scale.pageAlignHorizontally = true;
        scale.pageAlignVertically = true;
    },
    update: function() {
        game.state.start('play');
    }
};
