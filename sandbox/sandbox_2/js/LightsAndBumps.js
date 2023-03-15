/**
 * Created with JetBrains WebStorm.
 * User: tdbe
 * Date: 06-10-12
 * Time: 21:08
 * To change this template use File | Settings | File Templates.
 */

/*

    Author: Tudor Berechet

*/


//this is the most clear and well informed article I found on the subject despite a security warning: http://ogldev.atspace.co.uk/www/tutorial18/tutorial18.html
//you can use a proxy (such as google translate) to view it with no worries.


//Logic:
/*
    create lightsource in data.js, with a direction. (directional point light)
    when drawing a Vertex on screen, once you have vertex.x.y.z, calculate:
     - a normal to the triangle (it should actually be a blended normal ("vertex normal") (blended with adjacent faces, for a smooth result)
     - a raytrace(lightsource, point)
    this raytrace will calculate light intensity based on the angle between the light and the normal:

 "With our normal and our directional light, we can apply Lambert's law to calculate the diffuse component multiplier
 for any given vertex. Lambert's law looks for the cosine of the two vectors (the Normal and the Light Location vector),
 which is calculated by taking the dot product of the two (normalized) vectors." -http://pyopengl.sourceforge.net/context/tutorials/shader_5.xhtml

Lambert's law is the cosine between the normal and the light direction.
This image (if you also think of cosine) illustrates why light is strongest at 90 degrees, and nonexistent for angles between 180 and 360 (and 0):
 http://i.imgur.com/QyGTi.png

*/

function interpolateIntensityOnEdge(current_point_y, top_point_y, bottom_point_y, top_point_intensity, bottom_point_intensity, i_Slope){
    //var i_Slope = (bottom_point_intensity - top_point_intensity) / (bottom_point_y - top_point_y);
    //return Math.round( top_point_intensity + ((current_point_y - top_point_y) * i_Slope) );
    return ( top_point_intensity + ((current_point_y - top_point_y) * i_Slope) );
}

function interpolateIntensityOnScanLine(current_point_x, left_x, right_x, left_intensity, right_intensity, i_Slope){
    //wikipedia http://en.wikipedia.org/wiki/Linear_interpolation
    //var i_Slope = (right_intensity - left_intensity) / (right_x - left_x);
    //return Math.round( left_intensity + ((current_point_x - left_x) * i_Slope) );
    return ( left_intensity + ((current_point_x - left_x) * i_Slope) );
}



function interpolateUVOnEdge(current_point_y, top_point_y, bottom_point_y, top_point_z, bottom_point_z, slope, thees){
    //var Z_Slope = (bottom_point_z - top_point_z) / (bottom_point_y - top_point_y);
    return top_point_z + ((current_point_y - top_point_y) * slope);
    //return thees + slope;
}

function interpolateUVOnScanLine(x, triangleLeft_x, triangleRight_x, left, right, u_Slope, v_Slope){
    //console.log("u: "+left.u + ((x - triangleLeft_x) * u_Slope)+"; v: "+left.v + ((x - triangleLeft_x) * v_Slope));
    return { "u": left.u + ((x - triangleLeft_x) * u_Slope), "v": left.v + ((x - triangleLeft_x) * v_Slope)};

}

function tiltThisNormal(point, bumpColor){
    //example: if the pixel is left of the light, and the bumpMap says it needs to be lightened,
    //we tilt the normal of that pixel towards the right by an amount.
    bumpColor -= 128;//128;
    bumpColor /=40;
    //var divide = 5;
    //normal.x /= divide;
    //normal.y /= divide;
    if(bumpColor > 0){//normal needs to be moved towards light
        if(point.x < light.direction.x){
            point.normal.x += bumpColor;
        } else
            point.normal.x -= bumpColor;

        if(point.y > light.direction.y){
            point.normal.y -= bumpColor;
        } else
            point.normal.y += bumpColor;


    } else
    {//normal needs to be moved away from light
        if(point.x > light.direction.x){
            point.normal.x -= bumpColor;
        } else
            point.normal.x += bumpColor;

        if(point.y < light.direction.y){
            point.normal.y += bumpColor;
        } else
            point.normal.y -= bumpColor;

    }

    return point.normal;
}

function dot(p1, p2){
    return p1.x * p2.x + p1.y * p2.y + p1.z * p2.z;
}

//cross product of 2 vectors from the 3 vertices.
function getTriangleNormal(b, a, c) {
    //{'x':-c.x, 'y':-c.y,'z':-c.z}
    var u = sub(c, a);//get edge vector
    var v = sub(b, a);
    return x(u,v);//u, v; // http://en.wikipedia.org/wiki/File:Cross_product_vector.svg
    //normal = normalization(normal);
    //this.n1 += this.n2 += this.n3 += normal;
}

function length(p){
    return Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
}

//http://www.fundza.com/vectors/normalize/index.html
function normalization(p){
    magnitude = length(p);
    return {
        x : p.x / magnitude,
        y : p.y / magnitude,
        z : p.z / magnitude
    };
}

function normalizationFace(p){
    magnitude = length(p)/2;
    return {
        x : p.x / magnitude,
        y : p.y / magnitude,
        z : p.z / magnitude
    };
}

function normalizationVertex(p){
    magnitude = length(p)/2.5;
    return {
        x : p.x / magnitude,
        y : p.y / magnitude,
        z : p.z / magnitude
    };
}

function sub(p1, p2){
    return {
        x : p1.x - p2.x,
        y : p1.y - p2.y,
        z : p1.z - p2.z
    };
}

//http://freespace.virgin.net/hugo.elias/routines/r_cross.htm
function x(u, v){//cross product.

    return {
        x : ((u.y * v.z) - (v.y * u.z)),
        y : ((u.z * v.x) - (v.z * u.x)),
        z : ((u.x * v.y) - (v.x * u.y))
    };
}

/*

    -each vertex of the same triangle has the same normal
    -you must normalize the normal once you compute it.

 //http://gamedev.stackexchange.com/questions/8408/best-way-to-compute-vertex-normals-from-a-triangles-list




 //MIT lecture on dot and cross (vectors):
 //http://www.academicearth.org/lectures/vectors-dot-products-cross-products-3d-kinematics

 //normals: http://stackoverflow.com/questions/6656358/calculating-normals-in-a-triangle-mesh
 //http://www.flipcode.com/archives/Vertex_Normals.shtml

 //http://www.flipcode.com/archives/Doing_Your_Own_Lighting.shtml
 //http://rbwhitaker.wikidot.com/diffuse-lighting-shader
 //http://archive.gamedev.net/archive/reference/articles/article325.html


 //My gamedev stackexchange question: http://gamedev.stackexchange.com/questions/38213/depth-interpolation-for-z-buffer-with-scanline




 Step 1. set each vertex normal to (0,0,0)

 Step 2. compute light source direction and we Normalize it.

 Step 3. if cube.type > 5, create another for loop between the ones inside Renderer.js, where you go through all triangles:
{
    ( you get the "var d1, d2, d3" again and you:)

     foreach triangle:
        compute face normal and Normalize it
        foreach vertex on current triangle:
            set vertex.normal = vertex.normal + face normal //this way we average (we sum up) all face normals around 1 vertex.

}--- Now we've averaged all normals for each vertex of all triangles.


 Step 4.
{
    ( inside the final for loop in renderer.js:)
     foreach vertex of current triangle:
     normalize( vertex.normal ) //normalize again. now, after ALL summations are done.

     we must calculate the cosine of angle between the normal and the light direction
     ^ which can be done with the dot function.
     we multiply the light.intensity by the above result.

}--- Now we have a normallized (and averaged) normal for each vertex of current triangle.
 --- And we have the light intensity of each vertex of the current triangle.


 Step 5.
 {
   ( inside the surface renderer, where I do the scanline filling:)
    now, we must interpolate the light intensity of all the points between the 3 vertices (the lines of the triangle)
        then we must interpolate the light intensity of each pixel inside the triangle
        (using the same scanline methods from filling and z-buffering).
}



The Dot product:
 A · B = A.x * B.x + A.y * B.y + A.z * B.z
 http://www.conitec.net/shaders/shader_work2.htm


//You won't believe just how long I had to dig around the internet to piece together all the steps for this project.
//All courses/articles/books you find lack one step or another. And academic texts are the worse: you can never actually implement anything off of them.
//Without having had solid project overview, my code is quite messy as you can see. Almost as if I had never implemented a software renderer before. :D
    */