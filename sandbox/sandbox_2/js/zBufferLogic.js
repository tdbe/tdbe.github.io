/*

 Author: Tudor Berechet

 */



// The painter's algorithm I use until this point, will not work for intersecting triangles an stuff.
// So I will do z-buffering
/* Logic:
 Drawing the scene:
 if the target zBuffer position is empty, or, it has another pixel which is further away{
    I store the pixel's z value in a depth buffer (a matrix as big as the viewport).
    I render the pixel
 }

 */

var depthBuffer = [];

function initDepthBuffer(width, height, value){
    for(var i=0; i< width; i++){
        depthBuffer[i] = [];
        for(var j = 0; j< height; j++){
            depthBuffer[i][j] = value;
        }
    }
}


//I read something about Bresenham's line algorithm which uses only integers. That one's supposed to be faster, since with my interpolation, here I am doing Math.round twice per pixel 60 times a second...
//http://books.google.dk/books?id=LBm1khtUX0cC&pg=PA61&lpg=PA61&dq=scanline+interpolation&source=bl&ots=kOPbq5BXhj&sig=0eTHgqhdiMnEMGUODiIu0DVP8fE&hl=en&sa=X&ei=5EVsUJjwD-XN4QSYw4HIDQ&redir_esc=y#v=onepage&q=scanline%20interpolation&f=false
//http://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm
//TODO: try to implement that ^ if you have time.

//BTW, I am NOT going to handle any aliasing which results from this rounding to integers...
function addCompareZBuffer(i, j, z){
    //console.log(" ["+i+"]["+j+"]" + "; rounded to ["+Math.round(i)+"]["+Math.round(j)+"]");
    i=Math.round(i);
    j=Math.round(j);

    try{//TODO: fix the few sweep left and right fringe cases; they trigger the catch here (because they go < 0 and > cavas.width). this has something to do with the fact that I use the context2d functions to render.
        if(depthBuffer[i][j] < z){
            //console.log("added z= " + z + "; over old z: " + depthBuffer[i][j] + "; rounded ["+i+"]["+j+"]" );
            depthBuffer[i][j] = z;

            return true;
        } else
            return false;
    }
    catch (e){
        //console.log("that fringe context2d case; " + e);
        return false;
    }

}



//formulas used here, are from this course: https://docs.google.com/viewer?a=v&q=cache:OGfSIWWtX58J:https://syllabus.byu.edu/uploads/0_a9W7Jct0_7.ppt+&hl=en&pid=bl&srcid=ADGEESg3dQ9ePiYxjTyg5k2wL7ljqWy0ZzaAIMciJEHqYmfqBQ32LBQNfpnpMHTzc5TrKZEpKZc2iOBHdwCbiQQPN-Chjbu-nKdrBsOTiepA-Ff1jgI40gmGEPka7Clt2gWmJMe1qKlJ&sig=AHIEtbRKS6ZCGwbd0HX12aB75Uj_n96PDA&pli=1
//The 2 functions below are "the same" as far as programming & variables go, but the logic is slightly different.
//So for academic purposes I chose to have 2 separate functions.
function interpolateDepthOnScanLine(current_point_x, left_x, right_x, left_z, right_z, Z_Slope){
    //wikipedia http://en.wikipedia.org/wiki/Linear_interpolation

    //optimization with z_Slope figured out from this article: http://www.gamespp.com/graphicsprogramming/informationOnTheZBufferAlgorithm.html
    //var Z_Slope = (right_z - left_z) / (right_x - left_x);
    return left_z + ((current_point_x - left_x) * Z_Slope);

    //return left_z + ((current_point_x - left_x) * (right_z - left_z) / (right_x - left_x));

    //return right_z - (right_z - left_z) * (right_x - current_point_x) / (right_x - left_x);
}

function interpolateDepthOnEdge(current_point_y, top_point_y, bottom_point_y, top_point_z, bottom_point_z, Z_Slope){
    //var Z_Slope = (bottom_point_z - top_point_z) / (bottom_point_y - top_point_y);
    return top_point_z + ((current_point_y - top_point_y) * Z_Slope);

    //return top_point_z + ((current_point_y - top_point_y) * (bottom_point_z - top_point_z) / (bottom_point_y - top_point_y));

    //return top_point_z - (top_point_z - bottom_point_z) * (top_point_y - current_point_y) / (top_point_y - bottom_point_y);
}

/*
 function interpolateDepthOnEdge(current_point_y, top_point_y, bottom_point_y, top_point_z, bottom_point_z){
 //var Z_Slope = (bottom_point_z - top_point_z) / (bottom_point_y - top_point_y);
 //var Z = top_point_z + ((current_point_y - top_point_y) * Z_Slope);

 return top_point_z + ((current_point_y - top_point_y) * (bottom_point_z - top_point_z) / (bottom_point_y - top_point_y));

 //return top_point_z - (top_point_z - bottom_point_z) * (top_point_y - current_point_y) / (top_point_y - bottom_point_y);
 }
*/



/*
function xinitDepthBuffer(width, height, value){
    depthBuffer = [];
}

function xaddCompareZBuffer(i, j, z){

    var result = false;
    try{//if depthBuffer[i][j] isn't undefined.
        if(depthBuffer[i][j] >= z){
            depthBuffer[i][j] = z;
            result = true;
        }
    }
    catch(e){
        try{
            depthBuffer[i] = [];//create an object that holds an array. Because in Javascript arrays are also objects.
            depthBuffer[i][j] = z;
            result = true;
            //console.log("Dirty fix in catch: ["+i+"]["+j+"] = "+ z);
        }
        catch(e){
            console.log("Couldn't add z to z-buffer: ["+i+"]["+j+"] = "+ z + "; message: " + e.message + "; e: " + e + ";");
        }
    }

    return result;
}
*/