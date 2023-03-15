/*

Author: Tudor Berechet


 */

/* NOTES:



 */


//var tick = 0.0;
var images = [];
var hole_sp = null;
var mouse_sp = null;
var mouseEyes_sp = null;
var mouseTrail_sp = null;
var paws_sp = null;
var cat_sp = null;
var catEyes_sp = null;
var pawsCat_sp = null;
//var enemyList = [];

var canvasBg;
var canvasMouse;
var canvasCat;
var ctx2d_bg;
var ctx2d_mouse;
var ctx2d_cat;

var lastClick = {
                    "x" : 0,
                    "y" : 0
                };
var clickAllowed = true;
var isWorking = false;
var isDragging = false;

function main()
{
    canvasBg = document.getElementById("cvsBg");
    canvasMouse = document.getElementById("cvsMouse");
    canvasCat = document.getElementById("cvsCat");

    initCanvas1(canvasBg, ctx2d_bg);
    initCanvas2(canvasMouse, ctx2d_mouse);
    initCanvas3(canvasCat, ctx2d_cat);

    initEvents();

    var imageArr = [
        'img/debug.png',
        'img/hole.jpg',
        'img/mouse.png',
        'img/cat.png',
        'img/catEyes.png',
        'img/mouseEyes.png',
        'img/paws.png',
        'img/mouseTrail.png',
        'img/pawsCat.png',
        'img/catEyesPoint.png'
    ];

    //after we load our assets we start the "game".
    startImageLoader(imageArr,
                     function(){//alert(img.src);

                         hole_sp = new Sprite(images[1], "hole", 0, 0, images[1].width, images[1].height);

                         //mouse_sp = new Sprite(images[2], "mouse", 645, 435, images[2].width, images[2].height);
                         mouse_sp = new Sprite(images[2], "mouse", Math.round(Math.random() * 660) + 1, Math.round(Math.random() * 480) + 1, images[2].width, images[2].height);
                         mouse_sp.doesItPatrol = doesTargetPatrol;
                         mouse_sp.radarDistance = targetRadarDistanceInTiles;
                         mouseEyes_sp = new Sprite(images[5], "mouseEyes", 637, 427, images[2].width, images[2].height);

                         paws_sp = new Sprite(images[6], "paws", 637, 427, images[2].width, images[2].height);
                         mouseTrail_sp = new Sprite(images[7], "mouseTrail", 637, 427, images[2].width, images[2].height);
                         mouseTrail_sp.isEnabled = defaultTrailBool;

                         //cat_sp = new Sprite(images[3], "cat", 15, 15, images[3].width, images[3].height);
                         cat_sp = new Sprite(images[3], "cat", Math.round(Math.random() * 660) + 1, Math.round(Math.random() * 480) + 1, images[3].width, images[3].height);
                         catEyes_sp = new Sprite(images[4], "catEyes", 0, 0, images[3].width, images[3].height);
                         catEyesPoint_sp = new Sprite(images[9], "catEyesPoint", 0, 0, images[3].width, images[3].height);
                         pawsCat_sp = new Sprite(images[8], "pawsCat", 0, 0, images[3].width, images[3].height);


                         drawSprite(cat_sp, ctx2d_cat );
                         drawSprite(mouse_sp, ctx2d_mouse);

                         setTimeout(function(){element = document.getElementById("msg");
                         element.parentNode.removeChild(element);}, 500);

                         //setInterval(gameFunction, 1000);
                         //gameFunction();

                     }
                    )
    ;

}


function gameFunction()
{
    aStar();
/*
    if(isWorking){
        moveSprite(mouse_sp, calculatePath(mouse_sp));
    }else if(gameOverScreen){
        gameOver(caught);
    }
*/
}

var gameOverScreen = false;
function gameOver(caught){
    //A* is over
    isWorking = false;
    toggleButtonsOffExcept(5, 6);
    currentOption = 5;

    if(caught){
        document.getElementById("gameOver").style.visibility = "visible";
    } else
        document.getElementById("gameOver2").style.visibility = "visible";

    document.getElementById("5").style.marginLeft = "10px";
    document.getElementById("cvsCat").style.borderColor = "black";
    gameOverScreen = true;
    clickAllowed = true;
}

function gameStopped(){
    //A* is over
    isWorking = false;
    toggleButtonsOffExcept(5, 6);
    currentOption = 5;

    document.getElementById("5").style.marginLeft = "10px";
    document.getElementById("cvsCat").style.borderColor = "black";
}


function getOptimalPoint(equallyFurthest, playerEnemySide, enemy){
    var point = equallyFurthest[Math.floor(equallyFurthest.length/2)];

    //with this random decision, our mouse always runs away slightly differently, and in a panicked manner. Also saves quite a few checks to see exactly which of the candidate squares is the most accurate furthest point from the enemy.

    //The mouse never thinks about where to go beyond a 1 square radius around it. And doesn't remember if it already visited a square.
    //Also, it will always run in the opposite direction of the enemy (on one axis, another or both).
    //This means that there are cases when it will run back and forth between the same 2 "equally furthest points" from enemy.

    if( Math.random() < 0.5 ){
        for(var i = 0; i < equallyFurthest.length; i++){
            //console.log("all from i++ : "+equallyFurthest[i].x + "][" + equallyFurthest[i].y);
            var squareEnemySide = getWhichSide(equallyFurthest[i], enemy);
            if(squareEnemySide.x == playerEnemySide.x || squareEnemySide.y == playerEnemySide.y){
                point = equallyFurthest[i];
                //console.log("found point in i++ and break");
                break;
            }
        }
    } else {
        for(var i = equallyFurthest.length-1; i >= 0; i--){
            //console.log("all from i-- : "+equallyFurthest[i].x + "][" + equallyFurthest[i].y);
            var squareEnemySide = getWhichSide(equallyFurthest[i], enemy);
            if(squareEnemySide.x == playerEnemySide.x || squareEnemySide.y == playerEnemySide.y){
                point = equallyFurthest[i];
                //console.log("found point in i-- and break");
                break;
            }
        }
    }
    //console.log("returned " + point.x + "][" + point.y);
    return point;
}


function getFurthestPoints(enemy, emptySquares){

    var furthest = {"x": {"distance":0, "points": []}, "y": {"distance":0, "points": []}};
    var enemyToGrid = {"x": enemy.x/30, "y": enemy.y/30};
    for(var i = 0; i < emptySquares.length; i++){
        //var side = getWhichSide(emptySquares[i], enemy);
        var d = Math.abs(emptySquares[i].x - enemyToGrid.x);
        if(furthest.x.distance < d){
            furthest.x.distance = d;
            furthest.x.points = [];
            furthest.x.points.push(emptySquares[i]);
        } else if(furthest.x.distance == d){
            //furthest.x.distance = d;
            furthest.x.points.push(emptySquares[i]);
        }

        var e = Math.abs(emptySquares[i].y - enemyToGrid.y);
        if(furthest.y.distance < e){
            furthest.y.distance = e;
            furthest.y.points = [];
            furthest.y.points.push(emptySquares[i]);

        } else if(furthest.y.distance == e){
            furthest.y.points.push(emptySquares[i]);
        }
    }
    if(furthest.x.distance >= furthest.y.distance){
        return furthest.x.points;
    } else{
        return furthest.y.points;
    }
}

var emptySquares = [];
function fetchEmptySquaresAround(sprite, save, special){
    //var emptySquares = [];
    save = [];
    var inGrid = {"x":sprite.x/30, "y":sprite.y/30};

    for(var i = inGrid.x - 1; i <= inGrid.x + 1; i++){
        for(var j = inGrid.y - 1; j <= inGrid.y + 1; j++){
            if(i>=0 && i<22 && j>=0 && j<16 && (!tileGrid[i][j] || (special && tileGrid[i][j].name == "mouse"))){
                save.push({"x":i, "y":j});
                if(sprite.name)
                    console.log("["+sprite.name+"] pushed empty square: .x: " + i + "; .y: " + j);
            }
        }

    }
    emptySquares = save;
    return save;
}

function runAwayFrom(sprite, enemy){
    //var target = { "x" : sprite.x, "y" : sprite.y};
    //console.log("'mouse' was at " + target.x + "][" + target.y);
    //compute which direction enemy is coming from
    //var whichSide = getWhichSide(sprite, enemy);

    var optimalSquare = getOptimalPoint(
                                            getFurthestPoints(
                                                              enemy,
                                                              fetchEmptySquaresAround(sprite, emptySquares)
                                                             ),
                                            getWhichSide(sprite, enemy),
                                            enemy
                                        );
    if(optimalSquare){
        console.log("[mouse] decided to run to: "+optimalSquare.x+"]["+optimalSquare.y);
        return { "x" : optimalSquare.x*30, "y" : optimalSquare.y*30};
    }
    else{ //we are stuck. there's no empty square to go to.
        console.log("[mouse] is stuck according to its FSM.");
        return sprite;
    }

}

function foundAnEnemy(sprite, enemy){
    var didFind = false;
    var whereAmI = [sprite.x/30+1, sprite.y/30+1];

    //console.log("whereAmI[0]: " + whereAmI[0] + "; whereAmI[1]: " + whereAmI[1] + "; sprite.radarDistance: " + sprite.radarDistance);
    dance:
    for (var i= whereAmI[0] - sprite.radarDistance -1; i <= whereAmI[0] + sprite.radarDistance -1; i++ ){
        for (var j = whereAmI[1] - sprite.radarDistance -1; j <= whereAmI[1] + sprite.radarDistance -1; j++ ){
            //console.log("["+i+"]["+j+"]");

            try{
                //if(tileGrid[i][j])
                //console.log("tileGrid[i][j].name = " + tileGrid[i][j].name + "; i= " + i +"; j = " + j);
                if(tileGrid[i][j] && tileGrid[i][j].name == enemy.name){
                    didFind = true;
                    break dance; //TODO: modify this code if you ever decide to add more than one enemy. Otherwise it'll always fetch the topLeftMost enemy.
                }
            } catch (e){}//I didn't check to see if current position + 3 is outside the grid or not...
        }
    }
    //console.log("_______________");
    return didFind;
}

function calculatePath(sprite){
    var target = { "x" : sprite.x, "y" : sprite.y};

    var oldX = target.x;
    var oldY = target.y;

    if( foundAnEnemy(sprite, cat_sp)){
        target = runAwayFrom(sprite, cat_sp);

        var chk = document.getElementById("c1");
        chk.checked=false;
        handlePatrol(chk);

    } else
    if(sprite.doesItPatrol){

        function randomMovement(){
            target.x += (30 * (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 0 : 1) );
            target.y += (30 * (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 0 : 1) );

            if(isOccupiedSquare(target.x, target.y)){
                //target.x = oldX;
                //target.y = oldY;
                target = { "x" : sprite.x, "y" : sprite.y};
                randomMovement();
            }
        }//declared and called a function inside another function. because Javascript.
        randomMovement();
    }

    return target;
}

function moveSprite(sprite, target){

    if(sprite.x != target.x || sprite.y != target.y){
        if(sprite.name == "cat"){
            clrscrSimple(sprite, ctx2d_cat);
            //drawSprite(sprite, ctx2d_cat, snapToGrid(sprite, target.x, target.y) );
            drawSprite(sprite, ctx2d_cat, snapToGrid(sprite, target.x, target.y) );
        }
        else if(sprite.name == "mouse"){
            clrscrSimple(sprite, ctx2d_mouse);

            //also draw mouse's view space
            drawSpriteViewSpace(mouseEyes_sp, sprite, target, ctx2d_mouse);
            drawSpriteWalkSpace(paws_sp, sprite, target, ctx2d_mouse);

            if(mouseTrail_sp.isEnabled)
                drawSprite(mouseTrail_sp, ctx2d_bg, sprite, true);

            drawSprite(sprite, ctx2d_mouse, snapToGrid(sprite, target.x, target.y) );
        }
    }

}

function clearStart(id){
    if (id == 4){

        gameFunction();
        isWorking = true;
        clickAllowed = false;


    } else if (id == 5){
        isWorking = false;
        clickAllowed = true;
        //clrscr();
    } else if (id == 6){
        isWorking = false;
        clickAllowed = true;
        clrscr();
    }
}


var currentOption = 0;
function toggle_btns(event, id){


    if(!isWorking || id == 4){
        currentOption = id;

        var e = event || window.event;

        e.target.style.marginLeft = "10px";

        document.getElementById("cvsCat").style.borderColor = document.defaultView.getComputedStyle(e.target,null).getPropertyValue("background-color");

        if(gameOverScreen){
            document.getElementById("gameOver").style.visibility = "";
            document.getElementById("gameOver2").style.visibility = "";
            //document.getElementById("5").style.marginLeft = "";
            gameOverScreen = false;
        }


        toggleButtonsOffExcept(id, 6);
    }

    clearStart(id);
}

function toggleButtonsOffExcept(id, buttons){
    for(var i=1; i<=buttons; i++){
        if(i != id){
            document.getElementById(i.toString()).style.marginLeft="";

        }
    }
}