var _ = require('lodash');
var Tile = require('../Tile');

var gridSizeX = 8,
    gridSizeY = 8,
    hexagonArray = [],
    validTint = 0x00aa00,
    invalidTint = 0xaa0000,
    noTint = 0xffffff,
    selectedTint = 0xffff00,
    selectedHexes = [],
    poppedHexes = [],
    emptyHexex = [],
    collectedTiles = {},
    selecting = false,
    selected = false,
    checkScale = true,
    tweenSpeed = 100,
    hexScale = 1;

var moveIndex,
    hexagonGroup,
    hexagonArray,
    hexagonWidth,
    hexagonHeight,
    sectorWidth,
    sectorHeight,
    hoverHex,
    gradient,
    pointsText;

var tiles = {
    red: { type: 'red' },
    green: { type: 'green' },
    blue: { type: 'blue' },
    purple: { type: 'purple' },
    yellow: { type: 'yellow' },
    link: { type: 'link', points: function() { return null; }, match: function() { return true; } }
};

var tileChance = {
    red: 100,
    green: 100,
    blue: 100,
    purple: 100,
    yellow: 100,
    link: 5
};

var tileChanceSum;

function getHexPosition() {
    var xOffset = game.input.worldX - hexagonGroup.x;
    var yOffset = game.input.worldY - hexagonGroup.y;

    var tempWidth = sectorWidth * hexScale;
    var tempHeight = sectorHeight * hexScale;

    var candidateX = Math.floor(xOffset / tempWidth);
    var candidateY = Math.floor(yOffset / tempHeight);
    var deltaX = xOffset % tempWidth;
    var deltaY = yOffset % tempHeight;

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

function newTile(x, y) {
    if(!tileChanceSum) {
        tileChanceSum = _.reduce(tileChance, function(result, value, key) {
            return result += value;
        }, 0);
    }

    var val = _.random(tileChanceSum);
    var tileType;

    for(var c in tileChance) {
        var chance = tileChance[c];
        val -= chance;

        if(val <= 0) {
            tileType = c;
            break;
        }
    }

    var type = tiles[tileType];
    var t = new Tile(type.type);
    t.match = type.match || t.match;
    t.points = type.points || t.points;

    t.sprite = game.add.sprite(x, y, t.type);
    return t;
}

function genPointsText(obj) {
    return _.reduce(obj, function(result, value, key) {
        var type = value.type.points();
        if(type === null)
            return result;
        return result + type + ': ' + value.count + '\n';
    }, 'Score:\n');
}

module.exports = {
    preload: function() {
        var hexagon = game.load.image('hexagon', 'assets/images/hexagon.png');
        hexagon.onFileComplete.add(function() {
            var hex = game.add.sprite(0, 0, arguments[1]);
            hexagonWidth = hex.texture.width;
            hexagonHeight = hex.texture.height;
            sectorWidth = hexagonWidth / 4 * 3;
            sectorHeight = hexagonHeight;
            gradient = (hexagonWidth / 4) / (hexagonHeight / 2);

            hex.destroy();
        });

        game.load.image('red', 'assets/images/red-gem.png');
        game.load.image('green', 'assets/images/green-gem.png');
        game.load.image('blue', 'assets/images/blue-gem.png');
        game.load.image('purple', 'assets/images/purple-gem.png');
        game.load.image('yellow', 'assets/images/yellow-gem.png');
        game.load.image('link', 'assets/images/link.png');
    },
    create: function() {
        var maxWidth = game.width / gridSizeX; 
        var maxHeight = game.height / gridSizeY;

        if(maxWidth < hexagonWidth || maxHeight < hexagonHeight + hexagonHeight / 2) {
            var w = maxWidth / hexagonWidth;
            var h = maxHeight / (hexagonHeight + hexagonHeight / 2);
            hexScale = w < h ? w : h;
        }

        pointsText = game.add.text(0, 0, 'Score:', { font: '14px Arial', fill: '#000000' });
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
                poppedHexes.push({ x: i, y: j });
            }
        }

        hexagonGroup.y = (game.height - hexagonHeight * hexScale * Math.ceil(gridSizeY / 2));
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
            if(selectedHexes.length >= 3) {
                _.forEach(selectedHexes, function(hex) {
                    var tile = hexagonArray[hex.x][hex.y].tile;

                    if(!collectedTiles[tile.type])
                        collectedTiles[tile.type] = { count: 0, type: tile };

                    collectedTiles[tile.type].count++;

                    var fadeOut = game.add.tween(tile)
                        .to({ alpha: 0 }, 300);

                    fadeOut.onComplete.add(function() {
                        tile.sprite.destroy();
                        hexagonArray[hex.x][hex.y].tile = undefined;
                        poppedHexes.push(hex);
                    });

                    fadeOut.start();
                });

                pointsText.text = genPointsText(collectedTiles);
            }

            selected = false;
            selecting = false;
            selectedHexes = [];
        }

        if(poppedHexes.length > 0 && !checkScale) {
            var leftOver = [];
            var tweens = [];
            _.forEach(poppedHexes, function(hex, index) {
                var x = hex.x;
                var y = hex.y;
                var tile, slideDown;

                if(y === 0) {
                    var currHex = hexagonArray[x][y];
                    tile = newTile(currHex.x, currHex.y - hexagonHeight * hexScale);
                    tile.sprite.alpha = 0;
                    tile.sprite.scale.x = hexScale;
                    tile.sprite.scale.y = hexScale;
                    hexagonGroup.add(tile.sprite);

                    slideDown = game.add.tween(tile.sprite)
                        .to({ y: currHex.y, alpha: 1 }, tweenSpeed);

                    slideDown.onComplete.add(function() {
                        currHex.tile = tile;
                    });

                    tweens.push(slideDown);
                }
                else if(hexagonArray[x][y - 1].tile !== undefined) {
                    tile = hexagonArray[x][y - 1].tile;

                    slideDown = game.add.tween(tile.sprite)
                        .to({ y: tile.sprite.y + hexagonHeight * hexScale }, tweenSpeed);

                    slideDown.onComplete.add(function() {
                        hexagonArray[x][y].tile = tile;
                        hexagonArray[x][y - 1].tile = undefined;
                        poppedHexes.push({ x: x, y: y - 1 });
                    });

                    tweens.push(slideDown);
                }
                else {
                    leftOver.push(index);
                }

            });

            poppedHexes = _.at(poppedHexes, leftOver);

            _.forEach(tweens, function(tween) {
                tween.start();
            });
        }

        selecting = selectedHexes.length > 0;

        if(selecting && hoverHex) {
            var pathMatch = _.findLastIndex(selectedHexes, function(hex) {
                return hex.x === hoverHex.x && hex.y === hoverHex.y;
            });

            if(pathMatch === -1) {
                var lastHex = selectedHexes[selectedHexes.length - 1];
                var adjacent = getAdjacent(lastHex.x, lastHex.y);
                var hoverIsAdjacent = _.some(adjacent, function(arg) {
                    return arg.x === hoverHex.x && arg.y === hoverHex.y;
                });
                var lastTile = hexagonArray[lastHex.x][lastHex.y].tile;
                var hoverTile = hexagonArray[hoverHex.x][hoverHex.y].tile;

                if(hoverIsAdjacent) {
                    if(lastTile.match(hoverTile) || hoverTile.match(lastTile))
                        selectedHexes.push(hoverHex);
                }
                else {
                    selectedHexes = [];
                    selecting = false;
                }
            }
            else {
                while(selectedHexes.length > pathMatch + 1)
                    selectedHexes.pop();
            }
        }

        for(var c in hexagonArray) {
            var column = hexagonArray[c];
            for(var h in column) {
                var hex = column[h];
                if(!hex.tile) {
                }
            }
        }

    },
    render: function() {
        clearMarker();
        if(checkScale) {
            checkScale = false;

            hexagonGroup.y = (game.height - hexagonHeight * hexScale * gridSizeY) / 2;
            hexagonGroup.x = (game.width - Math.ceil(gridSizeX / 2) * hexagonWidth - Math.floor(gridSizeX / 2) * hexagonWidth / 2) / 2;

            for(var i = 0; i < gridSizeX; i++) {
                for(var j = 0; j < gridSizeY; j++) {
                    var hexagonX, hexagonY, hexagon;

                    if(i % 2 === 0) { // Even columns
                        hexagonX = hexagonWidth * hexScale * i - i * hexagonWidth * hexScale * 0.25;
                        hexagonY = hexagonHeight * j * hexScale;
                    }
                    else { // Odd columns
                        hexagonX = hexagonWidth * i * 0.75 * hexScale;
                        hexagonY = hexagonHeight * hexScale * j + hexagonHeight * hexScale * 0.5;
                    }
                    
                    var displaceHex = hexagonArray[i][j];

                    displaceHex.x = hexagonX;
                    displaceHex.y = hexagonY;
                    displaceHex.scale.x = hexScale;
                    displaceHex.scale.y = hexScale;

                    if(displaceHex.tile && displaceHex.tile.sprite) {
                        var disT = displaceHex.tile.sprite;
                        disT.x = hexagonX;
                        disT.y = hexagonY;
                        disT.scale.x = hexScale;
                        disT.scale.y = hexScale;
                    }
                }
            }

        }

        if(hoverHex)
            placeMarker(hoverHex.x, hoverHex.y);

        if(selecting) {
            var lastHex = selectedHexes[selectedHexes.length - 1];
            var hex;

            if(lastHex) {
                var lastTile = hexagonArray[lastHex.x][lastHex.y].tile;
                var adjacent = getAdjacent(lastHex.x, lastHex.y);
                for(var a in adjacent) {
                    hex = adjacent[a];
                    var tile = hexagonArray[hex.x][hex.y].tile;
                    if(lastTile.match(tile) || tile.match(lastTile))
                        hexagonArray[hex.x][hex.y].tint = validTint;
                    else
                        hexagonArray[hex.x][hex.y].tint = invalidTint;
                }
            }

            for(var h in selectedHexes) {
                hex = selectedHexes[h];
                if(hex instanceof Object)
                    hexagonArray[hex.x][hex.y].tint = selectedTint;
            }
        }
    },
    resize: function() {
        var maxWidth = game.width / gridSizeX; 
        var maxHeight = game.height / gridSizeY;

        var tempScale = hexScale;

        if(maxWidth < hexagonWidth || maxHeight < hexagonHeight + hexagonHeight / 2) {
            var w = maxWidth / hexagonWidth;
            var h = maxHeight / (hexagonHeight + hexagonHeight / 2);
            hexScale = w < h ? w : h;
        }
        else {
            hexScale = 1;
        }

        checkScale = true;
    }
};
