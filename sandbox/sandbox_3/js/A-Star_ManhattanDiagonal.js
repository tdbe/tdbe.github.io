/**
 * Created with JetBrains WebStorm.
 * User: tdbe
 * Date: 30-10-12
 * Time: 17:24
 * To change this template use File | Settings | File Templates.
 */
/*
Author: Tudor Berechet
*/
var path = [];

var openPoints = [];
var closedPoints = [];

var D = 1;
var D2 = Math.sqrt(2)*D;//cost of diagonal movement
//var D2 = 0;//cost of diagonal movement

function getDistance(start, end){
    //http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
                            //just like chebyshev except min instead of max.
    var diagonal_dist = Math.min( Math.abs(start.x-end.x), Math.abs(start.y-end.y));
    var straight_dist = (Math.abs( start.x-end.x) + Math.abs( start.y-end.y));

    return D2 * diagonal_dist + D * (straight_dist - 2*diagonal_dist);
}


function getLastOpenPointWithLowestScore(){
    var lowestScore = 9001;
    var lowestTiles = [];
    for(var i=0; i < openPoints.length; i++){
        if(openPoints[i].S < lowestScore){
            lowestTiles = [];
            lowestScore = openPoints[i].S;
            lowestTiles.push(openPoints[i]);
        } else if(openPoints[i].S == lowestScore){
            lowestTiles.push(openPoints[i]);
        }
    }

    //console.log("lowestTiles[0]: " + lowestTiles[0] + "; lowestTiles.reverse()[0]: " + lowestTiles.reverse()[0]);
    return lowestTiles.reverse()[0];

}

/*

    A* algorithm, manhattan length.

    I need:
        - openPoints list (possible tiles to move to around cat -> give a score to each one)
        - closedPoints list (cat position, ) && hole position

        - Score: G_score + H_score:
                - G: distance cost: how far is openPoints[i] from cat?
                        - each square around cat has 1, then ++ as it spreads out.

                - H: heuristic score (estimate): movement cost:
                                         - number of squares between openPoints[i] and mouse (Manhattan length)
                                                -does not account for the obstacles or terrain type/altitude
                                         - diagonals: diagonal squares have slightly higher cost
         - When you find the target, you add it to the closedPoints list.
            - and you go backwards through that list to find the path.

        Algotithm:
        - add cat origin to OpenPoints
        - do until there are no more points in the OpenPoints list:
        {
             currentTile = the tile with the lowest score ;//first time around it's the cat tile
             //-If you have more than one point with the minimum score, then you choose the most recently found one. (unless you have a better idea)

             openPoints.remove(currentTile);
             closedPoints.add(currentTile);

             if(currentTile == mouseTile){
                //we found a path
                //"path" is public global.
                path = backtrackPathByIteratingThroughDotParents(currentTile);
                moveCatOneTileThisFrame(path);// where path.currentPosition saves where we are so we can pick up where we left off next frame (after the mouse reacts, in case he is patrolling)
                return;
             }

             var adjacent = getTilesAround(currentTile);
             for each i in adjacent[]
             {
                    if(adjacent[i] != in the closedPoints && adjacent[i] != aHole or outside screen){// && adjacent[i] != otherObstacles[args]){
                            if(adjacent[i] != in the openPoints){
                                openPoints.add(adjacent[i]);
                                adjacent[i].calculateScore(G, H);//NOTE: keep each of F, G and H in the node, not just F
                                adjacent[i].parent = currentTile;

                            } else{//already among the openPoints
                                //check to see if this path to that square is a better one
                                 //check if the G score for that square is lower if we use the current square to get there.
                                //check if the distance from cat to that square is lower if we create it by (currentTile.G + 1)
                                if(adjacent[i].G > currentTile.G + 1){

                                    adjacent[i].parent = currentTile;
                                    //adjacent[i] already has a score, but we REPLACE that
                                    //we recalculate the score with the currentTile as the parent. Because the current road to adjacent[i] that goes through currentTile, is shorter than whatever the previous road to adjacent[i] was. We've basically just shifted the node to a better parent.
                                    adjacent[i].calculateScore(G, H);
                                }

                            }

                      }
              }
        }

*/


function aStar(){
    isWorking = true;
    console.log("aStar running...");

    calculateStarScore(cat_sp);
    openPoints.push(cat_sp);
    var originalMouse = {"x": mouse_sp.x/30, "y": mouse_sp.y/30};

    function doWhileOpenPoints(){
        var currentTile = getLastOpenPointWithLowestScore();
        if(currentTile && currentTile.name){
            remove(currentTile, openPoints);
            currentTile = {"x": currentTile.x/30, "y": currentTile.y/30, "name":currentTile.name, "G": currentTile.G ,"H": currentTile.H, "S": currentTile.S};
        }
        else
            remove(currentTile, openPoints);
        closedPoints.push(currentTile);

        drawSprite(catEyesPoint_sp, ctx2d_cat, {"x":currentTile.x*30, "y":currentTile.y*30, "name":currentTile.name}, true);

        //did we win?
        if(currentTile.x == mouse_sp.x/30 && currentTile.y == mouse_sp.y/30 ){
            //we found a path
            console.log("cat has found a path. Chase will commence." );
            //"path" is public global.
            path = backtrackPath(currentTile);
            cat_sp.currentPosInPath = 0;

            function chase(){
                console.log("...chasing...");
                moveCatOneTileThisFrame();
                moveSprite(mouse_sp, calculatePath(mouse_sp));
                console.log("cat_sprite: [" + cat_sp.x+ "]["+cat_sp.y+"]; mouse_sp: ["+mouse_sp.x+"]["+mouse_sp.y+"];");

                if(originalMouse.x != mouse_sp.x/30 || originalMouse.y != mouse_sp.y/30){
                    //program still running but we need a new path. and to start a new chase.
                    originalMouse = {"x": mouse_sp.x/30, "y": mouse_sp.y/30};
                    reset_A_Star();
                    aStar();
                } else{
                    if(cat_sp.x == mouse_sp.x && cat_sp.y == mouse_sp.y){
                        //drawSprite(cat_sp, ctx2d_cat, cat_sp, true);
                        reset_A_Star();
                        gameOver(true);//true == mouse was caught

                        console.log("Target was caught.");
                        console.log("aStar stopped...");
                    } else if(isWorking){

                        setTimeout(chase, 200);
                    }
                }

            }
            if(isWorking)
                chase();

            return;
        }


        var adjacent = fetchClearSquaresAround({"x":currentTile.x, "y":currentTile.y, "name":currentTile.name});
        for( var i=0; i<adjacent.length; i++)
        {//drawSprite(mouseEyes_sp, ctx2d_cat, {"x":adjacent[i].x*30, "y":adjacent[i].y*30, "name":adjacent[i].name}, true);

            if( !findInArray(adjacent[i], closedPoints) ){// && adjacent[i] != otherObstacles[args]){
                if(!findInArray(adjacent[i], openPoints)){

                    adjacent[i].parent = currentTile;
                    calculateStarScore(adjacent[i]);
                    openPoints.push(adjacent[i]);

                    drawSprite(catEyes_sp, ctx2d_cat, {"x":adjacent[i].x*30, "y":adjacent[i].y*30, "name":adjacent[i].name}, true);

                } else{//already among the openPoints

                    //check if the distance from currentTile to adjacent[i] is lower if we create it by (currentTile.G + 1) (if we use the current square to get there)
                    if(adjacent[i].G > currentTile.G + 1){

                        adjacent[i].parent = currentTile;
                        //adjacent[i] already has a score, but we REPLACE that
                        //we recalculate the score with the currentTile as the parent. Because the current road to adjacent[i] that goes through currentTile, is shorter than whatever the previous road to adjacent[i] was. We've basically just shifted the node to a better parent.
                        calculateStarScore(adjacent[i]);

                        drawSprite(catEyes_sp, ctx2d_cat, {"x":adjacent[i].x*30, "y":adjacent[i].y*30, "name":adjacent[i].name}, true);

                    }

                }

            }
        }


        //draw
        if(openPoints.length > 0 && isWorking){
            if(mouse_sp.doesItPatrol)
                setTimeout(doWhileOpenPoints, 100);
            else
                setTimeout(doWhileOpenPoints, 150);
        }
        else if(openPoints.length < 1){
            gameOver(false);//false == mouse is unreachable
            reset_A_Star();
            console.log("Target is unreachable.");
            console.log("aStar stopped...");

        } else if(!isWorking){//user stopped algorithm
            gameOverScreen = false;
            reset_A_Star();
            gameStopped();
            console.log("aStar aborted... [on user's command]");

        }

    }
    doWhileOpenPoints();


}

function calculateStarScore(tile){
    //NOTE: keep each of F, G and H in the node, not just F
    var divide = 1;
    if(tile.name)
        divide = 30;
    //tile.G = getDistance({"x":cat_sp.x/30, "y":cat_sp.y/30}, {"x":tile.x/divide, "y":tile.y/divide});
    tile.G = (tile.parent ? tile.parent.G+1 : 0);
    tile.H = getDistance({"x":tile.x/divide, "y":tile.y/divide}, {"x":mouse_sp.x/30, "y":mouse_sp.y/30});
    tile.S = tile.G + tile.H;
}

function moveCatOneTileThisFrame(){
    // cat_sp.currentPosInPath saves where we are so we can pick up where we left off next frame

    var coords = path[cat_sp.currentPosInPath+1];
    if(coords ){
        moveSprite(cat_sp, {"x":coords.x*30, "y":coords.y*30});
        cat_sp.currentPosInPath++;
    }
}

function backtrackPath(){
    //ByIteratingThroughDotParents;
    var pathArray = [];
    var iter = closedPoints.reverse()[0];//this should be the mouse
    pathArray.push(iter);

    //drawSprite(pawsCat_sp, ctx2d_bg, {"x":iter.x*30, "y":iter.y*30, "name":iter.name}, true);

    while(iter.parent){
        pathArray.push(iter.parent);

        //drawSprite(pawsCat_sp, ctx2d_bg, {"x":iter.parent.x*30, "y":iter.parent.y*30, "name":iter.parent.name}, true);

        iter = iter.parent;
    }

    return pathArray.reverse();
}



function reset_A_Star(){
    path = [];

    openPoints = [];
    closedPoints = [];

    //mouse_sp.doesItPatrol = doesTargetPatrol;
}


function fetchClearSquaresAround(sprite){
    //var emptySquares = [];
    save = [];
    for(var i = sprite.x - 1; i <= sprite.x + 1; i++){
        for(var j = sprite.y - 1; j <= sprite.y + 1; j++){
            if(i>=0 && i<22 && j>=0 && j<16 && !tileGrid[i][j]
                || (tileGrid[i] && tileGrid[i][j] && tileGrid[i][j].name == "mouse")){
                save.push({"x":i, "y":j});
                if(sprite.name)
                    console.log("["+sprite.name+"] pushed empty square: .x: " + i + "; .y: " + j);
            }
        }

    }
    return save;
}