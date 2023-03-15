// usage: log('inside coolFunc', this, arguments);
// paulirish.com/2009/log-a-lightweight-wrapper-for-consolelog/
window.log = function f(){ log.history = log.history || []; log.history.push(arguments); if(this.console) { var args = arguments, newarr; args.callee = args.callee.caller; newarr = [].slice.call(args); if (typeof console.log === 'object') log.apply.call(console.log, console, newarr); else console.log.apply(console, newarr);}};

// make it safe to use console.log always
(function(a){function b(){}for(var c="assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),d;!!(d=c.pop());){a[d]=a[d]||b;}})
(function(){try{console.log();return window.console;}catch(a){return (window.console={});}}());


// place any jQuery/helper plugins in here, instead of separate, slower script files.


//http://www.pmddirect.com/wp/?p=427
/**
 * Rounds the supplied value to the precision specified by the precision parameter
 * @param {Number} value The value to round
 * @param {Number} precision The number of decimal places or precision to round to
 * @return {Number} The rounded number
 */
if(!Math.roundToPrecision)
{
    Math.roundToPrecision = function(value, precision)
    {
        //Guard.NotNull(value, 'value');

        //b = Math.pow(10, precision);
        //var t = Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
        //console.log("[[[[[Rounding: "+value+"; to: "+t);
        //return value.toFixed(precision);//Math.round(value * b) / b;

        //precision = Math.abs(parseInt(precision)) || 0;
        //value = value.toFixed(2);
        var coefficient = Math.pow(10, precision);
        var t = Math.round(value*coefficient)/coefficient;

        //console.log("[[[[[Rounding: "+value+"; to: "+parseFloat(value.toFixed(precision)));
        var t2 = (isNaN(t)? parseFloat(value.toFixed(2)):t);
        //console.log("[[[[[Rounding: "+value+"; to: "+t+"; or: " + t2);
        return t2;
        //return parseFloat(value.toFixed(precision));
        //console.log("[[[[[Rounding: "+value+"; to: "+Math.round(value));
        //return Math.round(value);
    }
}

var isDragging = false;
function initEvents(){

    $("#cvs").mousedown(function( event ){
            isDragging = true;
            event.preventDefault();
            //event.stopPropagation();

            if ( event.pageX == null || event.clientX != null ) {
                var doc = document.documentElement, body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc   && doc.clientTop  || body && body.clientTop  || 0);

                clickHandler(event, event.pageX, event.pageY);
                previousClick.x = currentClick.x;
                previousClick.y = currentClick.y;
                //camera.rotationBonus.x = camera.rotationBonus.y = 0;
            }
        }
    )
    ;
    $("#cvs").mousemove(//jQuery cross browser mouse position listener
        function( event ){
            if ( isDragging && (event.pageX == null || event.clientX != null) ) {
                var doc = document.documentElement, body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc   && doc.clientTop  || body && body.clientTop  || 0);

                event.preventDefault();
                //event.stopPropagation();

                clickHandler(event, event.pageX, event.pageY);
            }
        }
    )
    ;
    $(window).mouseup(function( event ){
            isDragging = false;

            if ( false && (event.pageX == null || event.clientX != null) ) {
                var doc = document.documentElement, body = document.body;
                event.pageX = event.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0);
                event.pageY = event.clientY + (doc && doc.scrollTop  || body && body.scrollTop  || 0) - (doc   && doc.clientTop  || body && body.clientTop  || 0);

                clickHandler(event, event.pageX, event.pageY);
            }
        }
    )
    ;


}

var clickAllowed = true;
var previousClick = {"x":0, "y":0};
var currentClick = {"x":0, "y":0};
function clickHandler(event, pageX, pageY){

    if(clickAllowed){
        var coords = canvas.relMouseCoords(event);
        previousClick.x = currentClick.x;
        previousClick.y = currentClick.y;
        currentClick.x = coords.x -2;
        currentClick.y = coords.y -2;
    }

}


//http://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
function relMouseCoords(event){
    var totalOffsetX = 0;
    var totalOffsetY = 0;
    var currentElement = this;

    do{
        totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
        totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
    }
    while(currentElement = currentElement.offsetParent);

    var canvasX = event.pageX - totalOffsetX - document.body.scrollLeft + document.documentElement.scrollLeft;
    var canvasY = event.pageY - totalOffsetY - document.body.scrollTop + document.documentElement.scrollTop;

    return {x:canvasX, y:canvasY}
}
HTMLCanvasElement.prototype.relMouseCoords = relMouseCoords;



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
    img.onload = function(){ callback(img); };//.call();
    img.src = src;
    //return img;
};