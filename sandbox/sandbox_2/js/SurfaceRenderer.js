
/*

 Author: Tudor Berechet

 */


// In order to calculate the distance between different triangles, I've heard, generally
// the most efficient method is to average the z position of all 3 points in a triangle.
// And then sort the triangle distances and draw.
function paintersAlgorithm(){
    var triangles = [];

    for (var i = 0; i < object3d.sides.length; i++){
        var triangle = {
            'i' : i,
            'z' : (  //this is the average distance between the 3 points in the current triangle
                    object3d.scrnSpacePts[object3d.sides[i].a].z +
                    object3d.scrnSpacePts[object3d.sides[i].b].z +
                    object3d.scrnSpacePts[object3d.sides[i].c].z
                  )/3
        };
        triangles.push(triangle);
    }

    //now I should have a sorted array of all triangles of the object.
    //(triangles exactly the same distance will not have the same index, but it's not a problem in our scope)
    return triangles.sort(function(a,b){
                                            return (a.z - b.z);
                                       }
                         )
    ;
}


//NOTE: Apparently perspective-correct interpolation is only used for texturing; for depth buffers is enough to do regular interpolation. According to "Mathematics for 3D Game Programming and Computer Graphics" By Eric Lengyel: http://books.google.dk/books?id=bfcLeqRUsm8C&pg=PA116&lpg=PA116&dq=perspective+correct+%22interpolation%22+%22scanline%22&source=bl&ots=FqTwbZqRjA&sig=vINFGJnuMOUu7PT3rsVq3ow4brs&hl=en&sa=X&ei=WThrUOGOLcrO4QTWm4CYDg&redir_esc=y#v=onepage&q=perspective%20correct%20%22interpolation%22%20%22scanline%22&f=false
//I do use the reciprocal of z though. Because 1/z is linear in screen space, but not z.

//Scan line triangle filling:
//For current triangle, scan all the lines from the topmost point to the bottommost point,
// from 2d screen space. Note to self, what is "topmost" and "bottommost" changes during the scan. (because we have 3 points)
function scanLineTriangleFill(d1, d2, d3, color, normal)
{

    //console.log("d1.z: "+d1.z);
    var triangle = {//points and lines must be built/sorted so that they start from top left (our canvas origin)
                      'points': [
                                    {'x' : d1.x, 'y' : d1.y, 'z' : 1/d1.z, 'u': d1.u/d1.z, 'v': d1.v/d1.z, 'diffuseIntensity' : d1.diffuseIntensity },
                                                            //we do linear interpolation so we need linear z, u and v.
                                    {'x' : d2.x, 'y' : d2.y, 'z' : 1/d2.z, 'u': d2.u/d2.z, 'v':d2.v/d2.z, 'diffuseIntensity' : d2.diffuseIntensity },

                                    {'x' : d3.x, 'y' : d3.y, 'z' : 1/d3.z, 'u': d3.u/d3.z, 'v': d3.v/d3.z, 'diffuseIntensity' : d3.diffuseIntensity }
                                ],/*
                      'lines': [
                                    {p1 : 0, p2 : 1},
                                    {p1 : 0, p2 : 2},
                                    {p1 : 1, p2 : 2}
                                  ],*/
                      'left_x' : 0,//local leftmost. the current point on the left side of the triangle we're handling
                      'left_y' : 0,//etc.
                      'left_z' : 0, //the z's are for depth information for the z-buffer
                      'right_x' : 0,
                      'right_y' : 0,
                      'right_z' : 0,
                      'left_intensity' : 0,
                      'right_intensity' : 0,
                      'left' : {'u':0, 'v':0},
                      'right' : {'u':0, 'v':0}
                   };
    var baseOfSurfaceNormal;
    if(object3d.type>5)
        baseOfSurfaceNormal = (obj.type == 1 ? {'x':(d1.x+d3.x)/2,'y':(d1.y+d3.y)/2} : {'x':(d1.x+d2.x+d3.x)/3,'y':(d1.y+d2.y+d3.y)/3} );

    //So I sort them. Vertically. Later I determine if the middle point is left or right of the top point.
    triangle.points.sort(function(p1,p2) {//Compare "p1" and "p2" in some fashion, and return -1, 0, or 1
                                            return p1.y - p2.y;
                                         }
                        )
    ;

    //console.log('x: '+triangle.points.x+'; y: '+triangle.points.y+'; z: '+triangle.points.z+'; u: '+triangle.points.u+'; v: '+triangle.points.v);

    // http://www-users.mat.uni.torun.pl/~wrona/3d_tutor/tri_fillers.html
    /*
     "For each scanline, find the points consisting the edges of the triangle.
     Then, draw a horizontal line between those points. Do this for all scanlines and you are done.
     But how can we find these points quickly? Using linear interpolation!"
     -paraphrased from article. Article doesn't handle the z coordinate. Must figure out how to interpolate those later.

     Also:
     "The general function for linear interpolation is:
     f(X) = A + X*((B-A)/steps) where we slide from A to B in steps steps"

     below I apply the pseudocode and the above function:
     (except I don't do the gouraud shading (I don't do any shading for that matter)) Perhaps later.

     I figure out which point&line is on which side and then fill from point to point between them.
     */

    var interp_delta_x1, interp_delta_x2, interp_delta_x3;

    interp_delta_x1=(triangle.points[1].x-triangle.points[0].x) / (triangle.points[1].y-triangle.points[0].y);
    interp_delta_x2=(triangle.points[2].x-triangle.points[0].x) / (triangle.points[2].y-triangle.points[0].y);
    interp_delta_x3=(triangle.points[2].x-triangle.points[1].x) / (triangle.points[2].y-triangle.points[1].y);

    triangle.left_x = triangle.right_x = triangle.points[0].x;
    triangle.left_y = triangle.right_y = triangle.points[0].y;
    triangle.left_z = triangle.right_z = triangle.points[0].z;
    //triangle.left_intensity = triangle.points[0].diffuseIntensity;
    //triangle.right_intensity = triangle.points[0].diffuseIntensity;
    //console.log("triangle.left_x: "+ triangle.left_x +"; triangle.left_y: "+triangle.left_y+"; triangle.left_z: " + triangle.left_z);
    //if(object3d.type>6){
    //    triangle.left.u = triangle.right.u = triangle.points[0].u;
    //    triangle.left.v = triangle.right.v = triangle.points[0].v;
        //console.log("left.u: "+triangle.left.u+"; left.v: "+triangle.left.v);
    //}

    if(object3d.type == 4)
        prevTriangleLeftY = triangle.left_y; //don't mind this, this is an optimization for mode 4. I use it to skip every few lines, to draw less px.
    var Z_Slope1;
    var Z_Slope2;
    var i_Slope1;
    var i_Slope2;
    var u_Slope1;
    var u_Slope2;
    var v_Slope1;
    var v_Slope2;
    if(interp_delta_x1 > interp_delta_x2) {//means that the 2nd point is to the right of the first point
        //triangle.right_z = triangle.points[1].z;
        if(object3d.type >4){
            Z_Slope1 = (triangle.points[2].z - triangle.points[0].z) / (triangle.points[2].y - triangle.points[0].y);
            Z_Slope2 = (triangle.points[1].z - triangle.points[0].z) / (triangle.points[1].y - triangle.points[0].y);
        }
        if(object3d.type>5){
            i_Slope1 = (triangle.points[2].diffuseIntensity - triangle.points[0].diffuseIntensity) / (triangle.points[2].y - triangle.points[0].y);
            i_Slope2 = (triangle.points[1].diffuseIntensity - triangle.points[0].diffuseIntensity) / (triangle.points[1].y - triangle.points[0].y);
        }
        if(object3d.type > 6){
            u_Slope1= (triangle.points[2].u - triangle.points[0].u) / (triangle.points[2].y - triangle.points[0].y);
            u_Slope2= (triangle.points[1].u - triangle.points[0].u) / (triangle.points[1].y - triangle.points[0].y);
            v_Slope1= (triangle.points[2].v - triangle.points[0].v) / (triangle.points[2].y - triangle.points[0].y);
            v_Slope2= (triangle.points[1].v - triangle.points[0].v) / (triangle.points[1].y - triangle.points[0].y);
        }
        for(triangle.left_y; triangle.left_y<=triangle.points[1].y; triangle.left_y++)//top to 2nd point
        {
            if(object3d.type <4){
                buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, color);
                //buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, {R:Math.round(color.R+triangle.left_y/10), G:Math.round(color.G+triangle.left_y/10), B:Math.round(color.B+triangle.left_y/10), A:color.A});
            } else if (object3d.type > 5){

                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity, triangle.left, triangle.right, normal, baseOfSurfaceNormal);
            } else if (object3d.type > 4){
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity);
            }
            else {
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color);
            }


            triangle.right_y++;
            triangle.left_x+=interp_delta_x2;
            triangle.right_x+=interp_delta_x1;
            if(object3d.type >4){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left_z =interpolateDepthOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].z, triangle.points[2].z, Z_Slope1);
                triangle.right_z =interpolateDepthOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].z, triangle.points[1].z, Z_Slope2);
            }
            if(object3d.type>5){
                triangle.left_intensity = interpolateIntensityOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].diffuseIntensity, triangle.points[2].diffuseIntensity, i_Slope1);
                triangle.right_intensity =interpolateIntensityOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].diffuseIntensity, triangle.points[1].diffuseIntensity, i_Slope2);
                //console.log("left pt intensity: " + triangle.left_intensity + "; right pt intensity: " + triangle.right_intensity);
            }
            if(object3d.type > 6){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left.u =interpolateUVOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].u, triangle.points[2].u, u_Slope1, triangle.left.u);
                triangle.right.u =interpolateUVOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].u, triangle.points[1].u, u_Slope2, triangle.right.u);
                triangle.left.v =interpolateUVOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].v, triangle.points[2].v, v_Slope1, triangle.left.v);
                triangle.right.v =interpolateUVOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].v, triangle.points[1].v, v_Slope2, triangle.right.v);
            }

        }

        //we got to the 2nd point, which is to the right, so our right_x and y become 2nd point x and y.
        triangle.right_x = triangle.points[1].x;
        triangle.right_y = triangle.points[1].y;
        //triangle.right_intensity = triangle.points[1].diffuseIntensity;
        if(object3d.type >4){
            //Z_Slope1 = (triangle.points[2].z - triangle.points[0].z) / (triangle.points[2].y - triangle.points[0].y);
            Z_Slope2 = (triangle.points[2].z - triangle.points[1].z) / (triangle.points[2].y - triangle.points[1].y);
        }
        if(object3d.type >5){
            //i_Slope1 = (triangle.points[2].diffuseIntensity - triangle.points[0].diffuseIntensity) / (triangle.points[2].y - triangle.points[0].y);
            i_Slope2 = (triangle.points[2].diffuseIntensity - triangle.points[1].diffuseIntensity) / (triangle.points[2].y - triangle.points[1].y);
        }
        if(object3d.type > 6){
            //u_Slope1= (triangle.points[2].u - triangle.points[0].u) / (triangle.points[2].y - triangle.points[0].y);
            u_Slope2= (triangle.points[2].u - triangle.points[1].u) / (triangle.points[2].y - triangle.points[1].y);
            //v_Slope1= (triangle.points[2].v - triangle.points[0].v) / (triangle.points[2].y - triangle.points[0].y);
            v_Slope2= (triangle.points[2].v - triangle.points[1].v) / (triangle.points[2].y - triangle.points[1].y);
        }
        for(triangle.left_y; triangle.left_y<=triangle.points[2].y; triangle.left_y++)//from the 2nd point to bottom(3rd) point
        {
            if(object3d.type <4){
                buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, color);
                //buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, {R:Math.round(color.R+triangle.left_y/10), G:Math.round(color.G+triangle.left_y/10), B:Math.round(color.B+triangle.left_y/10), A:color.A});
            } else if (object3d.type > 5){

                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity, triangle.left, triangle.right, normal, baseOfSurfaceNormal);
            } else if (object3d.type > 4){
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity);
            }
            else {
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color);
            }

            triangle.right_y++;
            triangle.left_x+=interp_delta_x2;
            triangle.right_x+=interp_delta_x3;
            if(object3d.type >4){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left_z =interpolateDepthOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].z, triangle.points[2].z, Z_Slope1);
                triangle.right_z =interpolateDepthOnEdge(triangle.right_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].z, triangle.points[2].z, Z_Slope2)
            }
            if(object3d.type>5){
                triangle.left_intensity = interpolateIntensityOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].diffuseIntensity, triangle.points[2].diffuseIntensity, i_Slope1);
                triangle.right_intensity =interpolateIntensityOnEdge(triangle.right_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].diffuseIntensity, triangle.points[2].diffuseIntensity, i_Slope2);
            }
            if(object3d.type > 6){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left.u =interpolateUVOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].u, triangle.points[2].u, u_Slope1, triangle.left.u);
                triangle.right.u =interpolateUVOnEdge(triangle.right_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].u, triangle.points[2].u, u_Slope2, triangle.right.u);
                triangle.left.v =interpolateUVOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].v, triangle.points[2].v, v_Slope1, triangle.left.v);
                triangle.right.v =interpolateUVOnEdge(triangle.right_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].v, triangle.points[2].v, v_Slope2, triangle.right.v);
            }
        }
    }
    else {//else second point is to the left of the first point

        if(object3d.type >4){
            Z_Slope1 = (triangle.points[1].z - triangle.points[0].z) / (triangle.points[1].y - triangle.points[0].y);
            Z_Slope2 = (triangle.points[2].z - triangle.points[0].z) / (triangle.points[2].y - triangle.points[0].y);
        }
        if(object3d.type >5){
            i_Slope1 = (triangle.points[1].diffuseIntensity - triangle.points[0].diffuseIntensity) / (triangle.points[1].y - triangle.points[0].y);
            i_Slope2 = (triangle.points[2].diffuseIntensity - triangle.points[0].diffuseIntensity) / (triangle.points[2].y - triangle.points[0].y);
        }
        if(object3d.type > 6){
            u_Slope1= (triangle.points[1].u - triangle.points[0].u) / (triangle.points[1].y - triangle.points[0].y);
            u_Slope2= (triangle.points[2].u - triangle.points[0].u) / (triangle.points[2].y - triangle.points[0].y);
            v_Slope1= (triangle.points[1].v - triangle.points[0].v) / (triangle.points[1].y - triangle.points[0].y);
            v_Slope2= (triangle.points[2].v - triangle.points[0].v) / (triangle.points[2].y - triangle.points[0].y);
        }
        for(triangle.left_y; triangle.left_y<=triangle.points[1].y; triangle.left_y++)// from top to second point
        {
            if(object3d.type <4){
                buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, color);
                //buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, {R:Math.round(color.R+triangle.left_y/10), G:Math.round(color.G+triangle.left_y/10), B:Math.round(color.B+triangle.left_y/10), A:color.A});
            } else if (object3d.type > 5){

                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity, triangle.left, triangle.right, normal, baseOfSurfaceNormal);
            } else if (object3d.type > 4){
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity);
            }
            else {
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color);
            }

            triangle.right_y++;
            triangle.left_x+=interp_delta_x1;
            triangle.right_x+=interp_delta_x2;
            if(object3d.type >4){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left_z =interpolateDepthOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].z, triangle.points[1].z, Z_Slope1);
                triangle.right_z =interpolateDepthOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].z, triangle.points[2].z, Z_Slope2);
            }
            if(object3d.type>5){
                triangle.left_intensity = interpolateIntensityOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].diffuseIntensity, triangle.points[1].diffuseIntensity, i_Slope1);
                triangle.right_intensity =interpolateIntensityOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].diffuseIntensity, triangle.points[2].diffuseIntensity, i_Slope2);
            }
            if(object3d.type > 6){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left.u =interpolateUVOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].u, triangle.points[1].u, u_Slope1, triangle.left.u);
                triangle.right.u =interpolateUVOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].u, triangle.points[2].u, u_Slope2, triangle.right.u);
                triangle.left.v =interpolateUVOnEdge(triangle.left_y, triangle.points[0].y, triangle.points[1].y, triangle.points[0].v, triangle.points[1].v, v_Slope1, triangle.left.v);
                triangle.right.v =interpolateUVOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].v, triangle.points[2].v, v_Slope2, triangle.right.v);
            }
        }

        //we got to 2nd point, which is to the left, so left_x and left_y become -it-
        triangle.left_x = triangle.points[1].x;
        triangle.left_y = triangle.points[1].y;
        //triangle.left_intensity = triangle.points[1].diffuseIntensity;
        if(object3d.type >4){
            Z_Slope1 = (triangle.points[2].z - triangle.points[1].z) / (triangle.points[2].y - triangle.points[1].y);
            //Z_Slope2 = (triangle.points[2].z - triangle.points[0].z) / (triangle.points[2].y - triangle.points[0].y);
        }
        if(object3d.type >5){
            i_Slope1 = (triangle.points[2].diffuseIntensity - triangle.points[1].diffuseIntensity) / (triangle.points[2].y - triangle.points[1].y);
            //i_Slope2 = (triangle.points[2].diffuseIntensity - triangle.points[0].diffuseIntensity) / (triangle.points[2].y - triangle.points[0].y);
        }
        if(object3d.type > 6){
            u_Slope1= (triangle.points[2].u - triangle.points[1].u) / (triangle.points[2].y - triangle.points[1].y);
            //u_Slope2= (triangle.points[2].u - triangle.points[0].u) / (triangle.points[2].y - triangle.points[0].y);
            v_Slope1= (triangle.points[2].v - triangle.points[1].v) / (triangle.points[2].y - triangle.points[1].y);
            //v_Slope2= (triangle.points[2].v - triangle.points[0].v) / (triangle.points[2].y - triangle.points[0].y);
        }
        for(triangle.left_y; triangle.left_y<=triangle.points[2].y; triangle.left_y++)//from second point to bottom
        {
            if(object3d.type <4){
                buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, color);
                //buildLine(triangle.left_x, triangle.left_y, triangle.right_x, triangle.left_y, object3d.lineWidth, {R:Math.round(color.R+triangle.left_y/10), G:Math.round(color.G+triangle.left_y/10), B:Math.round(color.B+triangle.left_y/10), A:color.A});
            } else if (object3d.type > 5){

                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity, triangle.left, triangle.right, normal, baseOfSurfaceNormal);
            } else if (object3d.type > 4){
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color, triangle.left_z, triangle.right_z, triangle.left_intensity, triangle.right_intensity);
            }
            else {
                buildPixelScanLine(triangle.left_x, triangle.right_x, triangle.left_y, color);
            }

            triangle.right_y++;
            triangle.left_x+=interp_delta_x3;
            triangle.right_x+=interp_delta_x2;
            if(object3d.type >4){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left_z =interpolateDepthOnEdge(triangle.left_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].z, triangle.points[2].z, Z_Slope1);
                triangle.right_z =interpolateDepthOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].z, triangle.points[2].z, Z_Slope2)
            }
            if(object3d.type>5){
                triangle.left_intensity = interpolateIntensityOnEdge(triangle.left_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].diffuseIntensity, triangle.points[2].diffuseIntensity, i_Slope1);
                triangle.right_intensity =interpolateIntensityOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].diffuseIntensity, triangle.points[2].diffuseIntensity, i_Slope2);
            }
            if(object3d.type > 6){//                         (current_point_y,       top_point_y,       bottom_point_y,         top_point_z,        bottom_point_z)
                triangle.left.u =interpolateUVOnEdge(triangle.left_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].u, triangle.points[2].u, u_Slope1, triangle.left.u);
                triangle.right.u =interpolateUVOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].u, triangle.points[2].u, u_Slope2, triangle.right.u);
                triangle.left.v =interpolateUVOnEdge(triangle.left_y, triangle.points[1].y, triangle.points[2].y, triangle.points[1].v, triangle.points[2].v, v_Slope1, triangle.left.v);
                triangle.right.v =interpolateUVOnEdge(triangle.right_y, triangle.points[0].y, triangle.points[2].y, triangle.points[0].v, triangle.points[2].v, v_Slope2, triangle.right.v);
            }
        }

    }
    //NOTE: like I mentioned before, I won't be handling primitives unless I have to.
    //So instead of drawing each pixel,
    // I will draw a line from the first pixel of the current scanline to the last.
    //There's an exception to this, for the z-buffer demo.

    //TODO: canvas' antialiasing will make things all transparent and flickery unless I use thicker lines.
    // But that makes things render 6 times slower.

}


//Terribly slow Scan line triangle filling: for z-buffer check to see if we draw current px or not.
//Basically, instead of drawLine I draw an array of points. one for each pixel.
//This is the only "decent" way of being able to check the z-buffer before we draw each pixel.
//TODO: Disclaimer: this. will. be. slow.. Or ugly.
var prevTriangleLeftY;
var spec = false;
function buildPixelScanLine(triangleLeft_x, triangleRight_x, triangleLeft_y, color, triangleLeft_z, triangleRight_z, triangleLeft_intensity, triangleRight_intensity, left, right, normal, baseOfSurfaceNormal ){
    var p2;
    var plus = 5;
    if(object3d.type>4){

        var Z_Slope = (triangleRight_z - triangleLeft_z) / (triangleRight_x - triangleLeft_x);
        var i_Slope;
        var u_Slope;
        var v_Slope;
        if(object3d.type>5){
            i_Slope = (triangleRight_intensity - triangleLeft_intensity) / (triangleRight_x - triangleLeft_x);
        }
        if(object3d.type>6){
            u_Slope = (right.u - left.u) / (triangleRight_x - triangleLeft_x);
            v_Slope = (right.v - left.v) / (triangleRight_x - triangleLeft_x);
            //var uv = {"u":left.u, "v":left.v};
        }
        for(var p = triangleLeft_x; p < triangleRight_x; p++){
            color =  (object3d.type>5 ? object3d.color : color);

            //we apply zbuffering check
            var got_z = interpolateDepthOnScanLine(p, triangleLeft_x, triangleRight_x, triangleLeft_z, triangleRight_z, Z_Slope);
            //here we compare against the depth buffer and we draw if function returns true;
            if(addCompareZBuffer(p, triangleLeft_y, got_z)){

                if(object3d.type > 5){//here we apply the diffuse lighting to each pixel based on interpolation.

                    var intensity=0;

                    if(object3d.type > 6 ){//I'm calculating the UV coordinates both for the texture and for the bumpmap
                        //console.log("p: "+p+"; triangleLeft_x: "+triangleLeft_x+"; left.u: "+left.u+"; left.v: "+left.v+"; u_Slope: "+u_Slope+"; v_Slope: " +v_Slope);
                        var uv= interpolateUVOnScanLine(p, triangleLeft_x, triangleRight_x, left, right, u_Slope, v_Slope);
                        got_z =  (1/got_z);
                        //these should be the correct positions in the uv texture map.
                        //uv.u = Math.round((uv.u) * got_z *200);
                        //uv.v = Math.round((uv.v) * got_z *200);
                        uv.u = Math.round( Math.abs(uv.u * (got_z)) *200);
                        uv.v = Math.round( Math.abs(uv.v * (got_z)) *200);

                        //converting uv coordinates to 1d array coordinates, because the texture data is a 1d array.

                        var index = uv.u + texture[obj.txt].width * uv.v;
                        if(!(index>=0 && index<texture[obj.txt].data.length)){
                            index = -1000;
                        }
/*
                        if(object3d.type==7 && obj.type ==1){
                            if(uv.u < texture[obj.txt].height && uv.v < texture[obj.txt].width){
                                if(uv.u>160){
                                    console.log("uv.u: "+uv.u+"; uv.v: "+uv.v+"; out of: [" + texture[obj.txt].data.length+"]["+texture[obj.txt].data[uv.u].length+"]" );
                                    console.log("texture[obj.txt].data[uv.u][uv.v].R+G+B = "+(texture[obj.txt].data[uv.u][uv.v].R+texture[obj.txt].data[uv.u][uv.v].G+texture[obj.txt].data[uv.u][uv.v].B) );
                                    console.log("---" );
                                }
                            }

                        }*/
                        /*
                        try{
                        if(uv.u < texture[obj.txt].height && uv.v < texture[obj.txt].width){
                            color.R =  texture[obj.txt].data[uv.u][uv.v].R;
                            color.G =  texture[obj.txt].data[uv.u][uv.v].G;
                            color.B =  texture[obj.txt].data[uv.u][uv.v].B;
                            //console.log("R: "+color.R+"; G: "+color.G+"; B: "+ color.B);
                        }
                        }catch(e){
                            console.log("ERROR -----> uv.u: " + uv.u + "; uv.v: " + uv.v + "; data[u]: " + texture[obj.txt].data[uv.u]);
                        }
                        */

                        //I get the regular intensity anyway, because I'm going to blend the diffuse shading with the gouraud.
                        // A trick to smooth out the gouraud a bit, without having to interpolate the normals for each scanline point. (right now I'm using the surface normals)
                        intensity = Math.round(interpolateIntensityOnScanLine(p, triangleLeft_x, triangleRight_x, triangleLeft_intensity, triangleRight_intensity, i_Slope));
                        var fullPoint;
                        //if(texture[3].data[index])
                        if(obj.bump && index>-1000){// && texture[3].data[index].R != 128){
                            fullPoint = {'x': p, 'y': triangleLeft_y, 'z': 1/got_z, 'normal':{"x":normal.x, "y":normal.y,"z":normal.z*2}, 'bump':texture[3].data[index].R};

                            //Important step: Based on the blackness/lightness of the bumpMap texture, here I tilt the normal so it will be lit differently.
                            //I'm only using the Red component of the color, since I only use a grayscale bumpmap, and all 3 values are the same.
                            //console.log("normal ["+Math.round(fullPoint.normal.x)+"]["+Math.round(fullPoint.normal.y)+"]["+Math.round(fullPoint.normal.z)+";");
                            fullPoint.normal.x += (fullPoint.x - baseOfSurfaceNormal.x)/20;
                            fullPoint.normal.y += (fullPoint.y - baseOfSurfaceNormal.y)/20;
                            if(obj.bump2)
                                fullPoint.normal = tiltThisNormal(fullPoint, fullPoint.bump);
                            //console.log("normal ["+Math.round(fullPoint.normal.x)+"]["+Math.round(fullPoint.normal.y)+"]["+Math.round(fullPoint.normal.z)+"; and the point was ["+Math.round(fullPoint.x)+"]["+Math.round(fullPoint.y)+"]["+Math.round(fullPoint.z));
                            //console.log("____________________");
                            var light_direction = sub(light.direction, fullPoint);
                            var nldot = dot(fullPoint.normal, light_direction);
                            intensity = (intensity + (light.ambientFactor + nldot * light.intensity)/2);// + nldot*nldot*sign * light.intensity;
                            //intensity = light.ambientFactor + nldot * light.intensity;// + nldot*nldot*sign * light.intensity;

                            if(intensity < 0)
                                intensity /=5;

                            intensity = Math.round(intensity);
                        }


                        //intensity *=10;
                        //console.log("intensity: "+intensity);
                        //if (intensity >30 || intensity < -30){
                        //   console.log(intensity);
                        //}

                        //if(intensity > 5){
                        //    intensity /=2;
                        //    spec = true;
                        //} else spec = false;


                        if(index >-1000){//-1000 is a flag, not a possible value
                            color.R =  texture[obj.txt].data[index].R;
                            color.G =  texture[obj.txt].data[index].G;
                            color.B =  texture[obj.txt].data[index].B;
                            //console.log("R: "+color.R+"; G: "+color.G+"; B: "+ color.B);
                        }

                        uv.u += u_Slope;
                        uv.v += v_Slope;

                    } else{
                        //if we're not using the bump map, we just interpolate the light originating from the vertexes.
                        intensity = Math.round(interpolateIntensityOnScanLine(p, triangleLeft_x, triangleRight_x, triangleLeft_intensity, triangleRight_intensity, i_Slope));
                        //TODO: here is where we can add phong-specularHighlights, just recalculate angle on a per pixel basis instead of interpolating the vertex's light.
                    }


                    //console.log("color: [" +color.R+"]["+color.G+"]["+color.B+"]["+color.A+"]; color I need: ["+object3d.color.R +"]["+ object3d.color.G +"]["+ object3d.color.B +"]["+ object3d.color.A);
                    color = normalizeColor(color, intensity);//add the lights.
/*
                    //http://stackoverflow.com/questions/596216/formula-to-determine-brightness-of-rgb-color
                    //Y = 0.33 R + 0.5 G + 0.16 B
                    if(0.33 * color.R + 0.5 * color.G + 0.16 * color.B < light.ambient){//this is an object independent ambient light from the light source.
                        color = {R: color.R + light.ambient, G: color.G + light.ambient, B: color.B + light.ambient, A: color.A };
                    }
                    else
                        if(object3d.type > 6)//this is just because it's cool.
                            color = {R: color.R - light.ambient, G: color.G - light.ambient, B: color.B - light.ambient, A: color.A };
*/
                }
                buildPoint(p, triangleLeft_y, 2, color);
                if(fullPoint&& obj.bump2 && obj.bump3){
                    fullPoint.normal.x = (((fullPoint.normal.x - camera.position.x) * camera.distortion) / fullPoint.normal.z) + canvas.center.x;
                    fullPoint.normal.y = (((fullPoint.normal.y - camera.position.y) * camera.distortion) / fullPoint.normal.z) + canvas.center.y;
                    buildPoint(fullPoint.normal.x, fullPoint.normal.y, 1, {'R':192-(fullPoint.bump),'G':25+(fullPoint.bump),'B':255-(fullPoint.bump),'A':0.35});
                }
            }
        }
    } else{
    //this is the 1/4 mode. low resolution fill, for higher FPS.
    // This does not work with z-buffering, unless I check every px in the 4px*4px rectangle against the z-buffer. which isn't any better.
    // this is for mode 4 only. (because modes < 4 don't use this function at all)
        if(prevTriangleLeftY + 3 < triangleLeft_y){//optimization: only render every 3rd line, vertical-wise.
            for(var p = triangleLeft_x+1; p < triangleRight_x; p+=plus){
                //for higher FPS, I'm drawing 4px*4px sized "pixels". Otherwise it would run at 2FPS tops.
                p2 = p+plus;
                p2 = (p2 >= triangleRight_x ? triangleRight_x-p : plus);

                context2d.save();
                //context2d.rotate(5 * Math.PI / 180);//just playing around
                context2d.scale(0.9, 0.9);//just playing around
                context2d.translate(28, 16);//just playing around
                buildPoint(p, triangleLeft_y, p2, {R:color.R, G:color.G, B:color.B, A:Math.random() +.75});
                context2d.restore();
            }
            prevTriangleLeftY = triangleLeft_y;
        }
    }
}



function normalizeColor(color, intensity){
    //cores2.com
    //intensity = Math.acos(intensity) / Math.PI;
    // Bounds from 0 to Pi/2
    //intensity = Math.min(intensity, Math.PI / 2.0);

    // Normalize angle
    //intensity /= Math.PI / 2.0;
    //console.log(intensity);
    // Make color darker based on angle

    if(spec){
        //color.R =  102;
        //color.G +=  intensity/2;
        //color.B =  0;
        color.R =  102;
         color.G =  149;
         color.B =  0;
    }
    //if(obj.bump)
    //console.log(intensity);
    return {R: color.R + intensity, G: color.G + intensity, B: color.B + intensity, A: color.A };
}

function normalizeColors(color){
    var min = 0;

    min = (min > color.R ? color.R : (min > color.G ? color.G : (min > color.B ? color.B : min) ) );

    if(min < 0){
        min = Math.round(min/2);//this inefficient exploit simulates shadows, increases contrast.
        return {R: color.R - min, G: color.G -min, B: color.B -min, A: color.A };
    }
    else
        return color;

}

//max z: 7.197753398761272; min z: 3.791703256899924 <-- z of the points that were drawn to screen, by the scanline and zbuffer, gotten with interpolation but not 1/z.
//max z: 0.2649908532179404; min z: 0.13849507306889008 <-- same as above except I interpolated 1/z instead of z.
//      w: max z: 1; min z: -1

// max z: 7.22235597488859; min z: 3.7776440251114107; <-- z of the triangles vertices, after perspective projection.
//var min = 10;
//var max = -10;


