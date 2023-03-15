/*

Author: Tudor Berechet

Articles studied about software rendering that helped me build this project:
 http://www.codeproject.com/Articles/170296/3D-Software-Rendering-Engine-Part-I
 http://back2basic.phatcode.net/?Issue_%233:FreeBASIC_3D_Game_Programming_via_Software_Rendering_Part_3
 http://www.cores2.com/3D_Tutorial/
 http://code.dawnofthegeeks.com/javascript/

 */

/* NOTES:
I'm using a canvas2d to display what my renderer produces. For instance, for each point produced by my engine,
I will invoke the context2d function for drawing a "point'. For lines I will also use the context2d lineTo,
as I do not want to get into handling the primitives, rasterizing and anti-aliasing.
Don't worry though, the filling of the triangles,will be done on a per-pixel level.
-Though I will first draw a lineTo instead of an array of pixels (for efficiency, higher fps).
-Afterwards I will also draw each pixel, with z-buffering, as a proof of concept. A terribly slow one. More on that later.

NOTE: there is no actual camera. It is the object that translates/rotates, not the 'camera'.

 NOTE: because of html and <canvas>, I'll have my coordinate system be something of a rotated Right Handed one.
 To better explain this, I've drawn the coordinates on screen. Z goes toward the screen.
 As in, Z = 0 is the front of the frustum (the front clipping plane). Camera's Z (and your face) should be <=0. Object Zs are >=0.






 */


var canvas = null;
var context2d = null;

//var tick = 0.0;


function main()
{

    canvas = document.getElementById("cvs");
    context2d = canvas.getContext("2d", {alpha:false});

    //dynamically create and add a couple of center attributes to the canvas element; because Javascript
    canvas.center = {
                     'x' : context2d.canvas.clientWidth /2,
                     'y' : context2d.canvas.clientHeight /2
                    };

    initEvents();

    var imageArr = [
        'img/test_texture01.jpg',
        'img/test_texture.jpg',
        'img/test_texture0.jpg',
        'img/bumpMap.jpg'

    ];

    //after we load our asset we start the game (renderer) loop.
    startImageLoader(imageArr,
                function(){//alert(img.src);

                    buildTextureArrayFrom(images[0], 0);
                    buildTextureArrayFrom(images[1], 1);
                    buildTextureArrayFrom(images[2], 2);
                    buildTextureArrayFrom(images[3], 3);//this is the bump map

                    object3d = (obj.type == 1 ? cube : icosahedron );// cube || icosahedron
                    object3d.color = cube.color = icosahedron.color = {R:150, G:118, B:0, A:obj.transparency};
                    object3d.type = 4;// 1 == outline, 2 == triangle outline, 3 == filled triangles etc.

                    setTimeout(function(){element = document.getElementById("msg");
                                          element.parentNode.removeChild(element);
                                         }, 500);

                    gameLoop();
                }
            )
    ;

}

var previous = 0;
var delta = 0;
var current = 0;

//Aims to run at browser's default FPS. Which should be 60FPS.
function gameLoop()
{
    object3d = (obj.type == 1 ? cube : icosahedron );
    current = Date.now();
    delta = current - previous;
    previous = current;

    if(!isPaused){
        //clear/init depth buffer
        if(object3d.type > 4){
            initDepthBuffer(context2d.canvas.clientWidth, context2d.canvas.clientHeight, -10);
            //console.log("max z: " + max + "; min z: " + min);
        }
        //clear, save, render the frame(draw points, lines), restore context.
        draw();
    }
    //tick ++;

    //setTimeout(gameLoop,1000);
    window.requestAnimationFrame(gameLoop);
}


//Note: Request Animation Frame is an API to handle the game loop interval in a more efficient and browser specific way.
// http://www.google.com/url?sa=t&rct=j&q=&esrc=s&source=web&cd=2&ved=0CCUQFjAB&url=http%3A%2F%2Fpaulirish.com%2F2011%2Frequestanimationframe-for-smart-animating%2F&ei=qjFOUOi_H9Hc4QT4xYDoDg&usg=AFQjCNH5TovaCr6fbn63NYh2FQvVfBncMA&sig2=kg-CMv_EzavNZ2r-JiTODg&cad=rja
// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel
(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];

    }

    if (!window.requestAnimationFrame) {
        console.log("using setTimeout");
        window.requestAnimationFrame = function(callback, element) {
            var currTime = Date.now();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());




var isPaused = false;

function pause(){
    if(!isPaused){
        //clearInterval(gameInterval);
        //window.cancelAnimationFrame(gameLoop);
        isPaused = true;//alert("paused");
        console.log("Is Game Paused: " + isPaused);
    }
}

function resume(){
    if(isPaused){
        //window.cancelAnimationFrame();
        isPaused = false;
        console.log("Is Game Paused: " + isPaused);
    }
}

$(document).ready(function() {
    $(window).focus(resume);
    $(window).blur(pause);

});


function buildTextureArrayFrom(img, index){

    var tmpCvs = document.createElement("canvas");
    tmpCvs.width = img.width;
    tmpCvs.height = img.height;
    var tmpCtx = tmpCvs.getContext('2d');
    texture[index] = {
                        "data": null,
                        "width":0,
                        "height":0
                    };
    texture[index].width = img.width;
    texture[index].height = img.height;
    tmpCtx.drawImage(img, 0, 0, texture[index].width, texture[index].height);
    var tmpdata = tmpCtx.getImageData(0, 0, texture[index].width,texture[index].height);
    texture[index].data = makeProperStructure(tmpdata.data);

}
/*
function makeProperStructure(img, data){
    var tmpdata = myReverse(data);
    var newStructure = [];
    for(var i=0; i<img.height; i++){
        if(!newStructure[i])
            newStructure[i]= [];
        for(var j=0; j<img.width; j++){
            newStructure[i].push( {'R':tmpdata[tmpdata.length-1], 'G': tmpdata[tmpdata.length-2], 'B': tmpdata[tmpdata.length-3], 'A': tmpdata[tmpdata.length-4]} );
            tmpdata.pop();
            tmpdata.pop();
            tmpdata.pop();
            tmpdata.pop();
        }
    }
    return newStructure;
}

function myReverse(data){
    var newData = new Array();
    for (var i=0; i< data.length; i++){

        newData.push(data[i]);

    }
    return newData.reverse();
}
*/


function makeProperStructure(tmpdata){
    var newStructure = [];
    for(var i=0; i<tmpdata.length; i+=4){
        newStructure.push( {'R':tmpdata[i], 'G': tmpdata[i+1], 'B': tmpdata[i+2], 'A': tmpdata[i+3]} );
    }
    return newStructure;
}




