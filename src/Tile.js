function Tile(type) {
    var sprite = undefined;
    this.type = type;

    this.__defineSetter__("sprite", function(s) {
        if(sprite && sprite.destory instanceof Function)
            sprite.destroy();

        sprite = s;
    });

    this.__defineGetter__("sprite", function() {
        return sprite;
    });
}

Tile.prototype.match = function(tile) {
    return this.type === tile.type;
};

Tile.prototype.points = function() {
    return this.type[0].toUpperCase() + this.type.slice(1);
};

module.exports = Tile;
