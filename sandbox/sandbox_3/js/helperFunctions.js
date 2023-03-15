

//-1 is left or above. 1 is right or below;
function getWhichSide(sprite, enemy){
    var target = { "x" : 0, "y" : 0};

    if(enemy.x < sprite.x){
        target.x = -1;
    } else if(enemy.x > sprite.x){
        target.x = 1;
    }

    if(enemy.y < sprite.y){
        target.y = -1;
    } else if(enemy.y > sprite.y){
        target.y = 1;
    }

    return target;
}

function drawSpriteViewSpace(image, sprite, target, ctx){
    for (var i= target.x - sprite.radarDistance*30 ; i <= target.x + sprite.radarDistance*30 ; i+=30 ){
        for (var j = target.y - sprite.radarDistance*30 ; j <= target.y + sprite.radarDistance*30 ; j+=30 ){
            drawSprite(image, ctx, { "x": i, "y": j }, true );
        }
    }
}

function drawSpriteWalkSpace(image, sprite, target, ctx){

    for (var i = 0; i < emptySquares.length; i++){
        drawSprite(image, ctx, { "x": emptySquares[i].x*30, "y": emptySquares[i].y*30 }, true );

    }

}

function isOccupiedSquare(x, y){

    var p =  {
        "x" : Math.floor(x/30),
        "y" : Math.floor(y/30)
    };

    if(x > -1 && x < canvasBg.width && y > -1 && y < canvasBg.height)
        return tileGrid[p.x][p.y]; //this can be an instance or null(false)
    else
        return true;//this is in case we're checking outside the grid. it is treated as occupied.
}

function addToTileGrid(sprite){
    var x = sprite.x/30;
    var y = sprite.y/30;

    if(tileGrid[x] && !tileGrid[x][y]){
        tileGrid[x][y] = sprite;
        return true;
    }
    else return false;
}

function snapToGrid(sprite, x, y){

    var p =  {
        "x" : Math.floor(x/30)*30,
        "y" : Math.floor(y/30)*30
    };

    //sprite.x = p.x;
    //sprite.y = p.y;

    return p;
}

function findInArray(tile, tiles){

    for(var i=0; i< tiles.length; i++){
        if(tiles[i].x == tile.x && tiles[i].y == tile.y){
            return true;
        }
    }

    return false;
}

function remove(tile, array){

    for (var i=array.length-1; i>=0; i--){
        if(array[i].x == tile.x && array[i].y == tile.y){
            array.splice(i,1);
            break;
        }
    }
    //console.log("removed tile: " + tile + "; from array[" + array.indexOf(tile)+"]");

    //array.splice(array.indexOf(tile),1);

}



function stdCvsClearing(ctx){
    // Store the current transformation matrix
    ctx.save();

    // Use the identity matrix while clearing the canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasBg.width, canvasBg.height);

    // Restore the transform
    ctx.restore();
    //console.log("this canvas is being cleared: " + ctx.name);
}


function clrscr(){

    stdCvsClearing(ctx2d_bg);

    for (var i=0; i<=22; i++ ){
        for (var j = 0; j<=16; j++ ){
            if(tileGrid[i][j] != mouse_sp && tileGrid[i][j] != cat_sp){
                tileGrid[i][j] = null;
            }
        }
    }

    //for (var i=0; i<=22; i++ ){
    //    tileGrid[i] = [];
    //}
    console.log('the grid has been cleared minus the chaser and the target.');
}

function clrscrSimple(target, ctx){
    console.log('"' + target.name + '" moved. (clear, add)');
    stdCvsClearing(ctx);
    //r = false;
    for (var i=0; i<=22; i++ ){
        for (var j = 0; j<=16; j++ ){
            if(tileGrid[i][j] == target){
                tileGrid[i][j] = null;
                //r =  true;
            }
        }
    }
    //return r;
}




function drawSprite(sprite, ctx, snapped_pt, noTiles){
    var fromX = {property: sprite.x};
    var fromY = {property: sprite.y};

    if( !snapped_pt  ){
        snapped_pt = snapToGrid(sprite, sprite.x, sprite.y);
        sprite.x = snapped_pt.x;
        sprite.y = snapped_pt.y;
    }
    else{
        sprite.x = snapped_pt.x;
        sprite.y = snapped_pt.y;
    }

    if(noTiles || addToTileGrid(sprite)){
        //ctx.save();

        if(sprite.name == "cat" || sprite.name == "mouse"){
            var dur = 200;

            var toX = {property: snapped_pt.x};
            var twX;

            var toY = {property: snapped_pt.y};
            var twY;
            //console.log ("tween here: from: ["+fromX.property+"]["+fromY.property+"] to: ["+toX.property+"]["+toY.property+"]");
            //jquery animate: http://james.padolsey.com/javascript/fun-with-jquerys-animate/
            jQuery(fromX).animate(toX, {
                duration: dur,
                step: function() {
                    twX = this.property;
                    if(currentOption != 4)
                        stdCvsClearing(ctx);
                    ctx.drawImage(sprite.data, twX, twY, sprite.width, sprite.height);

                }
            });

            jQuery(fromY).animate(toY, {
                duration: dur,
                step: function() {
                    twY = this.property;
                    if(currentOption != 4)
                        stdCvsClearing(ctx);
                    ctx.drawImage(sprite.data, twX, twY, sprite.width, sprite.height);
                }
            });
        }
        else
        ctx.drawImage(sprite.data, snapped_pt.x, snapped_pt.y, sprite.width, sprite.height);
        //ctx.restore();
        //console.log("DrawSprite: "+ sprite.name +" on this canvas: " + ctx.name);
    }
}


//http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var canvasX = 0;
    var canvasY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent);

    canvasX = event.pageX - totalOffsetX - document.body.scrollLeft + document.documentElement.scrollLeft;
    canvasY = event.pageY - totalOffsetY - document.body.scrollTop + document.documentElement.scrollTop;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;

function clearSelection() {
    if ( document.selection ) {
        document.selection.empty();
    } else if ( window.getSelection ) {
        window.getSelection().removeAllRanges();
    }
}

function initCanvas(cvs, ctx){
    //window[cvs] = document.getElementById("cvs");

    //Using the WebGL2D library. An API that makes WebGL look like the canvas context2D (helps me with the display)
    // https://github.com/corbanbrook/webgl-2d
    WebGL2D.enable(window[cvs]); // adds new context "webgl-2d" to canvas
    // Easily switch between regular canvas 2d context and webgl-2d
    window[ctx] = window[cvs].getContext("webgl-2d");

    //contextGL.colorMask(1, 1, 1, 1);
    //ctx.fillStyle = "rgba(0, 0, 0, 0)";

    if (!window[ctx]) {
        alert("Canvas unsupported. TODO: replace this alert box with something less annoying.");
        return;
    }

    //dynamically create and add a couple of center attributes on the canvas elements; because Javascript
    window[cvs].center =
    {
        'x' : window[ctx].canvas.clientWidth /2,
        'y' : window[ctx].canvas.clientHeight /2
    };
}



//must do this 3 times because of canvas-2d and a context problem and me being too lazy to modify the library.
function initCanvas3(cvs, ctx){

    canvasCat = document.getElementById("cvsCat");
    ctx2d_cat = canvasCat.getContext("2d");

    //context2d.colorMask(1, 1, 1, 1);
    //ctx.fillStyle = "rgba(0, 0, 0, 0)";

    if (!ctx2d_cat) {
        alert("Canvas unsupported. TODO: replace this alert box with something less annoying.");
        return;
    }

    //dynamically create and add a couple of center attributes on the canvas elements; because Javascript
    ctx2d_cat.center =
    {
        'x' : ctx2d_cat.canvas.clientWidth /2,
        'y' : ctx2d_cat.canvas.clientHeight /2
    };
    ctx2d_cat.name = "cvsCat";
}

function initCanvas2(cvs, ctx){

    canvasMouse = document.getElementById("cvsMouse");
    ctx2d_mouse = canvasMouse.getContext("2d");

    //context2d.colorMask(1, 1, 1, 1);
    //ctx.fillStyle = "rgba(0, 0, 0, 0)";

    if (!ctx2d_mouse) {
        alert("Canvas unsupported. TODO: replace this alert box with something less annoying.");
        return;
    }

    //dynamically create and add a couple of center attributes on the canvas elements; because Javascript
    ctx2d_mouse.center =
    {
        'x' : ctx2d_mouse.canvas.clientWidth /2,
        'y' : ctx2d_mouse.canvas.clientHeight /2
    };
    ctx2d_mouse.name = "cvsMouse";
}

function initCanvas1(cvs, ctx){

    canvasBg = document.getElementById("cvsBg");
    ctx2d_bg = canvasBg.getContext("2d");

    //context2d.colorMask(1, 1, 1, 1);
    //ctx.fillStyle = "rgba(0, 0, 0, 0)";

    if (!ctx2d_bg) {
        alert("Canvas unsupported. TODO: replace this alert box with something less annoying.");
        return;
    }

    //dynamically create and add a couple of center attributes on the canvas elements; because Javascript
    ctx2d_bg.center =
    {
        'x' : ctx2d_bg.canvas.clientWidth /2,
        'y' : ctx2d_bg.canvas.clientHeight /2
    };
    ctx2d_bg.name = "cvsBg";
}




//clever multiple image loader from: http://stackoverflow.com/questions/10509694/jquery-how-to-check-if-images-have-finished-loading-in-ajax/10509808#10509808
function startImageLoader(imgArr, callback){
    var
    // This is a copy of the array of images
        imageAr = imgArr.slice(0),
    // This holds the javascript Image Objects
    //images = [],
    // This is the number of Images that have loaded
        loadedCount = 0;

    var imageLoaded = function(){
        // An image has finished loading, so increment the number of images loaded by 1
        loadedCount++;
        if(loadedCount>=imageAr.length){
            // If all images have finished loading, run the 'callback' function, to report back that images have all loaded
            callback.call();
        }
    };

    // Loop around each image url
    for(var i=0;i<imageAr.length;i++){
        // For each image, create a new object
        images[i] = new Image();
        // when the image finishes loading, call the imageLoaded function
        images[i].onload = imageLoaded;
        // Assign the image the appropriate src attribute
        images[i].src = imageAr[i];
    }
}

var loadImage = function(src, callback){
    var img;
    img = new Image();
    img.onload = function(){ callback(img); }//.call();
    img.src = src;
    //return img;
};



function initEvents(){

    $("#cvsCat").mousedown(function( event ){
            isDragging = true;
            event.preventDefault();
            //event.stopPropagation();

            if ( event.pageX == null || event.clientX != null ) {
                var doc = document.documentElement, body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc   && doc.clientTop  || body && body.clientTop  || 0);

                clickHandler(event, event.pageX, event.pageY);
            }
        }
    )
    ;
    $("#cvsCat").mousemove(//jQuery cross browser mouse position listener
        function( event ){
            if ( currentOption == 3 && isDragging && (event.pageX == null || event.clientX != null) ) {
                var doc = document.documentElement, body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc   && doc.clientTop  || body && body.clientTop  || 0);

                //clearSelection(); //done in CSS3 instead
                event.preventDefault();
                //event.stopPropagation();

                clickHandler(event, event.pageX, event.pageY);
            }
        }
    )
    ;
    $("#cvsCat").mouseup(function( event ){
            isDragging = false;

            if ( currentOption != 3 && (event.pageX == null || event.clientX != null) ) {
                var doc = document.documentElement, body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc   && doc.clientTop  || body && body.clientTop  || 0);

                clickHandler(event, event.pageX, event.pageY);
            }
        }
    )
    ;


}

function clickHandler(event, pageX, pageY){

    if(clickAllowed){
        var coords = canvasBg.relMouseCoords(event);
        lastClick.x = coords.x -2;
        lastClick.y = coords.y -2;

        if(currentOption == 1 && !isOccupiedSquare(lastClick.x, lastClick.y)){
            clrscrSimple(cat_sp, ctx2d_cat);
            drawSprite(cat_sp, ctx2d_cat, snapToGrid(cat_sp, lastClick.x, lastClick.y) );

        } else if (currentOption == 2 && !isOccupiedSquare(lastClick.x, lastClick.y)){
            clrscrSimple(mouse_sp, ctx2d_mouse);
            drawSprite(mouse_sp, ctx2d_mouse, snapToGrid(mouse_sp, lastClick.x, lastClick.y) );

        } else if (currentOption == 3){
            drawSprite(hole_sp, ctx2d_bg, snapToGrid(hole_sp, lastClick.x, lastClick.y) );

        }

    }

}
