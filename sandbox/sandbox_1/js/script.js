/*

 Used the WebGL example code for drawing a square and a triangle from this source: http://learningwebgl.com/blog/?p=28
 Combined with the fundamentals here: http://www.html5rocks.com/en/tutorials/webgl/webgl_fundamentals/
 */


/*
 http://www.html5rocks.com/en/tutorials/webgl/shaders/

 Shaders are part of the programmable pipeline
 shaders run directly on the gpu.

 vertex shaders: gl_Position, a 4D float vector, which is the final position of the vertex on screen.

 fragment shaders: gl_FragColor variable, another 4D float vector, which the final colour of our fragment
 , a fragment is delimited by three vertices.


 Shader Variables:
    Uniforms are sent to both vertex shaders and fragment shaders and contain values that stay the same across the entire frame being rendered. A good example of this might be a light's position.

    Attributes are values that are applied to individual vertices. Attributes are only available to the vertex shader. This could be something like each vertex having a distinct colour.

    Varyings are variables declared in the vertex shader that we want to share with the fragment shader. To do this we make sure we declare a varying variable of the same type and name in both the vertex shader and the fragment shader. A classic use of this would be a vertex's normal since this can be used in the lighting calculations.


 */

//window.onload = main;

function main() {
    /*
    var doc_w = $(document).width(); var pref_w = 960;
    var doc_h = $(document).height(); var pref_h = 732;
    var new_w = (doc_w < pref_w ? pref_w : doc_w);
    var new_h = (doc_h < pref_h ? pref_h : doc_h);
    //new_w != doc_w || new_h != doc_h ? window.resizeTo( doc_w, doc_h ) : null;
    if(new_w != doc_w || new_h != doc_h){
        window.resizeTo( doc_w, doc_h ); alert();
    }
    */
    var image = new Image();
    var contextGL;

    var imageArr = [
                    'img/enemy.png',
                    'img/bg.gif',
                    'img/heart.png',
                    'img/player.png',
                    'img/red.png',
                    'img/green.png',
                    'img/blue.png',
                    'img/sand.png'

                    ];


    startImageLoader(imageArr, function(){
        //alert('Images loaded!');

        // Get A WebGL context
        var canvas = document.getElementById("cvs");

        //Using the WebGL2D library. An API that makes WebGL look like the canvas context2D (helps me with the display)
        // https://github.com/corbanbrook/webgl-2d
        WebGL2D.enable(canvas); // adds new context "webgl-2d" to canvas
        // Easily switch between regular canvas 2d context and webgl-2d
        var contextGL = canvas.getContext("webgl-2d"); // create3DContext(canvas);//
        //contextGL.colorMask(1, 1, 1, 1);
        contextGL.fillStyle = "rgb(0, 0, 200)";

        if (!contextGL) {
            alert("Canvas unsupported. TODO: replace this alert box with something less annoying.");
            return;
        }

        //glOnce(canvas, contextGL);


        loadImage('img/debug.png',
                   function(img){//alert(img.src);
                                  images.splice(0, 0, img);
                                  var totallyProGame = new Game(canvas, contextGL, images);
                                  totallyProGame.start();
                                 }
                 )
        ;

    });


}



var images = [];
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

//this is from js/webGL/html5rocks-webgl-utils.js, the rest of which I don't use
/*
var create3DContext = function (canvas, opt_attribs) {
    var names = ["webgl", "experimental-webgl"];
    var context = null;
    for (var ii = 0; ii < names.length; ++ii) {
        try {
            context = canvas.getContext(names[ii], opt_attribs);
        } catch (e) {}
        if (context) {
            break;
        }
    }
    return context;
};
*/

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

/*
window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function( callback ){
            window.setTimeout(callback, 1000 / 60);
        };
})();
*/


/*
var positionLocation;
var texCoordLocation;
var texCoordBuffer;
var texture;
function glOnce(canvas, contextGL){
    // setup a GLSL program
    //compile the vertex and fragment shader
    vertexShader = createShaderFromScriptElement(contextGL, "2d-vertex-shader");
    fragmentShader = createShaderFromScriptElement(contextGL, "2d-fragment-shader");
    //link the shaders together in a program
    program = createProgram(contextGL, [vertexShader, fragmentShader]);
    contextGL.useProgram(program);

    // look up where the vertex data needs to go.
    positionLocation = contextGL.getAttribLocation(program, "a_position");

    // look up where the texture coordinates need to go.
    texCoordLocation = contextGL.getAttribLocation(program, "a_texCoord");


    //Create a vertex buffer to hold texture coordinates and fills it (texCoordBuffer)
    //Create a texture (createTexture)
    //Configure how the texture is sampled (texParameteri)


    // provide texture coordinates for the rectangle.
    texCoordBuffer = contextGL.createBuffer();
    contextGL.bindBuffer(contextGL.ARRAY_BUFFER, texCoordBuffer);

    contextGL.enableVertexAttribArray(texCoordLocation);
    contextGL.vertexAttribPointer(texCoordLocation, 2, contextGL.FLOAT, false, 0, 0);


    setRectangle(contextGL, 0.0, 0.0, 1.0, 1.0);


    // Create a texture.
    texture = contextGL.createTexture();
    contextGL.bindTexture(contextGL.TEXTURE_2D, texture);

    // Set the parameters so we can render any size image.
    contextGL.texParameteri(contextGL.TEXTURE_2D, contextGL.TEXTURE_WRAP_S, contextGL.CLAMP_TO_EDGE);
    contextGL.texParameteri(contextGL.TEXTURE_2D, contextGL.TEXTURE_WRAP_T, contextGL.CLAMP_TO_EDGE);
    contextGL.texParameteri(contextGL.TEXTURE_2D, contextGL.TEXTURE_MIN_FILTER, contextGL.NEAREST);
    contextGL.texParameteri(contextGL.TEXTURE_2D, contextGL.TEXTURE_MAG_FILTER, contextGL.NEAREST);
}


function render(canvas, contextGL, spriteArray) { //TODO: see about unnecessary overhead in this function. Maybe can improve performance.


    // set the resolution
    var resolutionLocation = contextGL.getUniformLocation(program, "u_resolution");
    contextGL.uniform2f(resolutionLocation, canvas.width, canvas.height);

    var buffer = contextGL.createBuffer();
    contextGL.bindBuffer(contextGL.ARRAY_BUFFER, buffer);
    contextGL.enableVertexAttribArray(positionLocation);
    contextGL.vertexAttribPointer(positionLocation, 2, contextGL.FLOAT, false, 0, 0);


    for(var i=0; i<spriteArray.length; i++){
        // Upload the image into the texture.
        contextGL.texImage2D(contextGL.TEXTURE_2D, 0, contextGL.RGBA, contextGL.RGBA, contextGL.UNSIGNED_BYTE, spriteArray[i].displayObject.data);



        setRectangle(contextGL, spriteArray[i].x, spriteArray[i].y, spriteArray[i].width, spriteArray[i].height);

        // draw
        contextGL.drawArrays(contextGL.TRIANGLES, 0, 6);
        }
        //return contextGL;
}

function randomInt(range) {
    return Math.floor(Math.random() * range);
}

function setRectangle(gl, x, y, width, height) {
    //var x1 = x;
    var x2 = x + width;
    //var y1 = y;
    var y2 = y + height;
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(
                                        [x, y,
                                         x2, y,
                                         x, y2,
                                         x, y2,
                                         x2, y,
                                         x2, y2
                                        ]), gl.STATIC_DRAW);
}


*/
// setup a rectangle from //10,20 to 80,30 in pixels
/*
 contextGL.bufferData(contextGL.ARRAY_BUFFER, new Float32Array(
 [
 0.0, 0.0,
 1.0, 0.0,
 0.0, 1.0,
 0.0, 1.0,
 1.0, 0.0,
 1.0, 1.0
 ]), contextGL.STATIC_DRAW);
 */