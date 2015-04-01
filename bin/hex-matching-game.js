(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var states = require('./states');
window.game = new Phaser.Game(800, 600, Phaser.AUTO);

states();
game.state.start('boot');


},{"./states":2}],2:[function(require,module,exports){
module.exports = function() { game.state.add("boot", require("./states/boot"));game.state.add("load", require("./states/load"));game.state.add("menu", require("./states/menu"));game.state.add("play", require("./states/play")); };
},{"./states/boot":3,"./states/load":4,"./states/menu":5,"./states/play":6}],3:[function(require,module,exports){
module.exports = {
    create: function() {
    },
    update: function() {
        game.state.start('play');
    }
};

},{}],4:[function(require,module,exports){
module.exports = {
    create: function() {
    },
    update: function() {
    },
};

},{}],5:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"dup":4}],6:[function(require,module,exports){
var gridSizeX = 6,
    gridSizeY = 6,
    hexagonArray = [],
    validTint = 0xb5fd40,
    invalidTint = 0xcd567d,
    noTint = 0xffffff,
    selectedHexes = [],
    selecting = false,
    selected = false;

var moveIndex,
    hexagonGroup,
    hexagonArray,
    hexagonWidth,
    hexagonHeight,
    sectorWidth,
    sectorHeight,
    hoverHex,
    gradient;


function getHexPosition() {
    var xOffset = game.input.worldX - hexagonGroup.x;
    var yOffset = game.input.worldY - hexagonGroup.y;

    var candidateX = Math.floor(xOffset / sectorWidth);
    var candidateY = Math.floor(yOffset / sectorHeight);
    var deltaX = xOffset % sectorWidth;
    var deltaY = yOffset % sectorHeight;

    if(xOffset < 0 || yOffset < 0) {
        hoverHex = null;
        return false;
    }

    if(candidateX % 2 === 0) {
        if(deltaX < ((hexagonWidth / 4) - deltaY * gradient)) {
            candidateX--;
            candidateY--;
        }

        if(deltaX < ((-hexagonWidth / 4) + deltaY * gradient))
            candidateX--;
    }
    else {
        if(deltaY >= hexagonHeight / 2) {
            if(deltaX < (hexagonWidth / 2 - deltaY * gradient))
                candidateX--;
        }
        else {
            if(deltaX < deltaY * gradient)
                candidateX--;
            else
                candidateY--;
        }
    }

    if(candidateX < 0 || candidateY < 0 || candidateX >= gridSizeX || candidateY >= gridSizeY) {
        hoverHex = null;
        return false;
    }

    hoverHex = { x: candidateX, y: candidateY };
    return hoverHex;
}

function getAdjacent(posX, posY) {
    var adjacent = [];

    if(posY - 1 >= 0) //up
        adjacent.push({ x: posX, y: posY - 1 });

    if(posY + 1 < gridSizeY) //down
        adjacent.push({ x: posX, y: posY + 1 });

    if(posX % 2 === 1) {
        //right
        if(posX < gridSizeX - 1) {
            if(posY >= 0) //up
                adjacent.push({ x: posX + 1, y: posY });
            if(posY + 1 < gridSizeY) //down
                adjacent.push({ x: posX + 1, y: posY + 1 });
        }

        //left
        if(posX - 1 >= 0) {
            if(posY >= 0) //up
                adjacent.push({ x: posX - 1, y: posY });
            if(posY + 1 < gridSizeY)//down
                adjacent.push({ x: posX - 1, y: posY + 1 });
        }

    }
    else {
        //right
        if(posX < gridSizeX - 1) {
            if(posY - 1 >= 0) //up
                adjacent.push({ x: posX + 1, y: posY - 1 });
            if(posY < gridSizeY) //down
                adjacent.push({ x: posX + 1, y: posY });
        }

        //left
        if(posX - 1 >= 0) {
            if(posY - 1 >= 0) //up
                adjacent.push({ x: posX - 1, y: posY - 1 });
            if(posY < gridSizeY)//down
                adjacent.push({ x: posX - 1, y: posY });
        }
    }

    return adjacent;
}

function clearMarker() {
    // Reset tint colors
    for(var i = 0; i < gridSizeX; i++)
        for(var j = 0; j < gridSizeY; j++)
            hexagonArray[i][j].tint = noTint;
}

function placeMarker(posX, posY) {
    hexagonArray[posX][posY].tint = validTint;
}

module.exports = {
    preload: function() {
        var hexagon = game.load.image('hexagon', 'src/assets/images/hexagon.png');
        hexagon.onFileComplete.add(function() {
            var hex = game.add.sprite(0, 0, arguments[1]);
            hexagonWidth = hex.texture.width;
            hexagonHeight = hex.texture.height;
            sectorWidth = hexagonWidth / 4 * 3;
            sectorHeight = hexagonHeight;
            gradient = (hexagonWidth / 4) / (hexagonHeight / 2);

            hex.destroy();
        });
    },
    create: function() {
        hexagonGroup = game.add.group();
        game.stage.backgroundColor = '#ffffff';

        for(var i = 0; i < gridSizeX; i++) {
            hexagonArray[i] = [];
            for(var j = 0; j < gridSizeY; j++) {
                var hexagonX, hexagonY, hexagon;

                if(i % 2 === 0) { // Even columns
                    hexagonX = hexagonWidth * i - i * hexagonWidth * 0.25;
                    hexagonY = hexagonHeight * j;
                }
                else { // Odd columns
                    hexagonX = hexagonWidth * i * 0.75;
                    hexagonY = hexagonHeight * j + hexagonHeight * 0.5;
                }

                hexagon = game.add.sprite(hexagonX, hexagonY, 'hexagon');
                hexagonGroup.add(hexagon);
                hexagonArray[i][j] = hexagon;
            }
        }

        hexagonGroup.y = (game.height - hexagonHeight * Math.ceil(gridSizeY)) / 2;
        hexagonGroup.x = (game.width - Math.ceil(gridSizeX / 2) * hexagonWidth - Math.floor(gridSizeX / 2) * hexagonWidth / 2) / 2;

        if(gridSizeY % 2 === 0)
            hexagonGroup.y -= hexagonHeight / 4;

        if(gridSizeX % 2 === 0)
            hexagonGroup.x -= hexagonWidth / 8;

        moveIndex = game.input.addMoveCallback(getHexPosition, hexagonGroup);

        game.input.onDown.add(function() {
            selectedHexes.push(getHexPosition());
        });

        game.input.onUp.add(function() {
            selected = true;
        });
    },
    update: function() {
        if(selected) {
            selected = false;
            selecting = false;
            selectedHexes = [];
        }

        selecting = selectedHexes.length > 0;

        if(selecting && hoverHex) {
            var contains = false;
            var h;
            for(h = selectedHexes.length - 1; h >= 0; h--) {
                var hex = selectedHexes[h];
                if(hex.x === hoverHex.x && hex.y === hoverHex.y) {
                    contains = true;
                    break;
                }
            }

            if(!contains) {
                var lastHex = selectedHexes[selectedHexes.length - 1];
                var adjacent = getAdjacent(lastHex.x, lastHex.y);

                for(var a in adjacent) {
                    var adj = adjacent[a];
                    if(hoverHex.x === adj.x && hoverHex.y === adj.y) {
                        contains = true;
                        break;
                    }
                }
                
                if(contains) {
                    selectedHexes.push(hoverHex);
                }
                else {
                    selectedHexes = [];
                    selecting = false;
                }
            }
            else {
                while(selectedHexes.length > h + 1)
                    selectedHexes.pop();
            }
        }
    },
    render: function() {
        clearMarker();
        if(hoverHex)
            placeMarker(hoverHex.x, hoverHex.y);

        if(selecting) {
            var adjacent = getAdjacent(selectedHexes[selectedHexes.length - 1].x, selectedHexes[selectedHexes.length - 1].y);
            var hex;
            for(var a in adjacent) {
                hex = adjacent[a];
                hexagonArray[hex.x][hex.y].tint = validTint;
            }

            for(var h in selectedHexes) {
                hex = selectedHexes[h];
                hexagonArray[hex.x][hex.y].tint = invalidTint;
            }
        }
    }
};

},{}]},{},[1,3,4,5,6]);
