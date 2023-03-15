
/*

 Author: Tudor Berechet

*/
var PIx2 = 2*Math.PI;
function draw(){
    context2d.clearRect(0, 0, canvas.width, canvas.height);
    context2d.save();
    cameraRotationTick();

    //buildBackgroundLayer();
	//since bg doesn't change, I'll just assign the background image in css instead...

    //NOTE: because of html and <canvas>, I'll have my coordinate system be right handed, BUT facing the other way.
    //To better explain this, I've drawn the coordinates lines on screen. Z (blue) goes toward the screen.
    // As in, the front plane of the frustum is 0, the back plane is 1, and the camera (and your face) is < -1

    //Logic: Perspective projection from Wikipedia: http://en.wikipedia.org/wiki/3D_projection#Perspective_projection
    //1. rotate points on each axis individually
    // |=> as in, the first 3 Θx,Θy,Θz matrices from this linear algebra equation: http://upload.wikimedia.org/math/f/e/9/fe946eac5e7efd1e15290634d74a79f2.png
    //2. translate each point
    // |=> as in, the subtraction at the end of this same linear algebra equation: http://upload.wikimedia.org/math/f/e/9/fe946eac5e7efd1e15290634d74a79f2.png
    //3. handle the projection:
    // |=> as in, the newly transformed points can now be projected onto the 2d plane by:
    // |=> b2D= (FoV)*(a3D/distance). //distance == a3D.z, because now we have our 3D cube into the centre
    //4. Profit. We've turned our 'a[,,]' into a 'd[,,]' and now projected it onto a 'b[,]'.

    // obviously, repeat^ on all the points.

    //NOTE: I'm not implementing the matrices, I'm implementing the equations for solving the matrices.
    // it's the same math, except I don't have to worry about the data structure.
    //That is to say,
    // I'm implementing this: http://upload.wikimedia.org/math/1/c/8/1c89722619b756d05adb4ea38ee6f62b.png
    // instead of this: http://upload.wikimedia.org/math/f/e/9/fe946eac5e7efd1e15290634d74a79f2.png


    //I move the camera further (actually I make the object smaller) when I apply zBuffering, because IT IS SLOW.
    if(object3d.type > 4){
        camera.distortion = 200;
        object3d.pointWidth = 10;
    }
    else{
        camera.distortion = 320;
        object3d.pointWidth = 16;
    }


    //Apply logic for each point of the 3d model (at this point, I have data for a cube). Update: also an icosahedron.
    for(var i = 0; i < object3d.points.length; i++)
    {
        //this is the d from wikipedia. and it has a d.x, d.y and d.z
        var d = { x:object3d.points[i].x, y:object3d.points[i].y, z:object3d.points[i].z };

        //instead of a static current object3d.points[i], we have the rotated and translated point we're currently on:
        var currentobject3dPoint = translatePoint(rotatePoint(d));
        //step 1 and step 2 done.
/*
        if(currentobject3dPoint.x > 1 || currentobject3dPoint < -1 ||
           currentobject3dPoint.y > 1 || currentobject3dPoint < -1 ||
           currentobject3dPoint.z > 1 || currentobject3dPoint < -1 )
*/

        //concept behind doing a "projection transform" from 3d to 2d:
        //we expand objects near to the camera, "distorting" the viewing frustum into a cube.
        //http://msdn.microsoft.com/en-us/library/windows/desktop/bb147302(v=vs.85).aspx
        //graphic: http://i.msdn.microsoft.com/dynimg/IC511469.png

        //Basically, the further a point is, the bigger it's Z coordinate. And we divide by Z.
        var x_2d = ((currentobject3dPoint.x - camera.position.x) * camera.distortion) / currentobject3dPoint.z;
        var y_2d = ((currentobject3dPoint.y - camera.position.y) * camera.distortion) / currentobject3dPoint.z;
        //step 3 done.

        //buildPoint(x_2d, y_2d, object3d.lineWidth);
        //I also center the points (which are relative to the "camera"), relative to the viewport.
        //buildPoint(x_2d + canvas.center.x, y_2d + canvas.center.y, object3d.lineWidth);
        object3d.scrnSpacePts[i] = {
                                 'x' : x_2d + canvas.center.x,
                                 'y' : y_2d + canvas.center.y,
                                 'z' : currentobject3dPoint.z,//1/
                                 //'w' : object3d.points[i].z,
                                 'u': 0,//object3d.points[i].u,
                                 'v': 0,//object3d.points[i].v,
                                 'normal' : {x:0, y:0, z:0},//Important: set all normals to 0 each frame
                                 //'uvnormal' : {x:0, y:0, z:0},
                                 //'sharedTriangles':0,
                                 'diffuseIntensity' : 0,
                                 'colorZ' : -Math.round(currentobject3dPoint.z*20)//don't mind this :D, its for colouring based on depth, for the corners and wireframe
                                };

        //alert(object3d.points[i].normal.x);
    }


    //before I start the scan line algorithm (in the next for loop below), I go through all the triangles and compute the normals
    if(object3d.type > 5 ){ //only if we want to compute the diffuse lighting, that is.
        //light.direction = normalization(light.direction);

        //compute all face normals and normalize them
        for(var l = 0; l < object3d.sides.length; l++)
        {
            var d_1, d_2, d_3;
            var s1, s2, s3;
            //for each d I take the 1st 2nd or 3rd point of each side in the side array, and it's corresponding processPoint
            d_1 = object3d.points[object3d.sides[l].a];
            d_2 = object3d.points[object3d.sides[l].b];
            d_3 = object3d.points[object3d.sides[l].c];

            s1 = object3d.scrnSpacePts[object3d.sides[l].a];
            s2 = object3d.scrnSpacePts[object3d.sides[l].b];
            s3 = object3d.scrnSpacePts[object3d.sides[l].c];

            //this is Step 3. (from the steps in LightsAndBumps.js)
            var triangleNormal = normalizationFace(
                                                getTriangleNormal(
                                                                    d_1, d_2, d_3
                                                                )//d_1, d_2, d_3
                                                );//

/*
            var uvtriangleNormal = normalization(
                getTriangleNormal(
                    d_1, d_2, d_3
                )//d_1, d_2, d_3
            );//
            //triangleNormal =
            //{'x':triangleNormal.x,'y':triangleNormal.y,'z':triangleNormal.z};
*/
            //var weightOne= 1;
            var weightTwo= 1;
            //var weightThree= 1;

            if(obj.fixedVertexNormalWeights){// && obj.type==1){
                //dirty fix for cubes. (proper fix would be calculating a weighted vertex normal, based on angles between faces.)
                //my fix assumes we have 2 triangles per face and doubles the weight of the lone triangle.
                //this ensures that the normals are averaged evenly. Considering a vertex can have more than one triangle per side connected to it.

                weightTwo = 2;
                /*
                if(l%2==0){
                    var which = findLoneVertex([d_1, d_2, d_3],[object3d.scrnSpacePts[object3d.sides[l--].a],object3d.scrnSpacePts[object3d.sides[l--].b], object3d.scrnSpacePts[object3d.sides[l--].c]]);
                    if(which==0)
                        weightOne=2;
                    else if(which==1)
                        weightTwo=2;
                    else weightThree = 2;
                }
                */
            }




            //the trick here is, adding more normals for each vertex, if there are triangles sharing vertices
            //this means I get a smooth transition with diffuse light when I compute it later.
            //This is a naive solution. I sum up instead of doing any actual angle calculations.
            // //The normal will not be perfect depending on how many triangles and on which side share the current vertex.
            s1.normal.x += triangleNormal.x;// *weightOne;
            s1.normal.y += triangleNormal.y;// *weightOne;
            s1.normal.z += triangleNormal.z;// *weightOne;
            //s1.sharedTriangles++;

            s2.normal.x += triangleNormal.x *weightTwo;//
            s2.normal.y += triangleNormal.y *weightTwo;//
            s2.normal.z += triangleNormal.z *weightTwo;//
            //s2.sharedTriangles++;

            s3.normal.x += triangleNormal.x;// *weightThree;
            s3.normal.y += triangleNormal.y;// *weightThree;
            s3.normal.z += triangleNormal.z;// *weightThree;
            //http://gamedev.stackexchange.com/questions/26951/calculating-the-2d-edge-normals-of-a-triangle
/*
            s1.uvnormal.x += uvtriangleNormal.x;//
            s1.uvnormal.y += uvtriangleNormal.y;//
            s1.uvnormal.z += uvtriangleNormal.z;//
            //s1.sharedTriangles++;

            s2.uvnormal.x += uvtriangleNormal.x;//
            s2.uvnormal.y += uvtriangleNormal.y;//
            s2.uvnormal.z += uvtriangleNormal.z;//
            //s2.sharedTriangles++;

            s3.uvnormal.x += uvtriangleNormal.x;//
            s3.uvnormal.y += uvtriangleNormal.y;//
            s3.uvnormal.z += uvtriangleNormal.z;//
            //s3.sharedTriangles++;
*/

            //setting the triangle normal so we can check the faces for backface culling
            object3d.sides[l].normal = translatePoint(rotatePoint(triangleNormal));//{'x':(d_1.x+d_2.x+d_3.x)/3,'y':(d_1.y+d_2.y+d_3.y)/3, 'z':(d_1.z+d_2.z+d_3.z)/3 }
            if(obj.normals){
                var debugNormalX = (((object3d.sides[l].normal.x - camera.position.x) * camera.distortion) / object3d.sides[l].normal.z) + canvas.center.x;
                var debugNormalY = (((object3d.sides[l].normal.y - camera.position.y) * camera.distortion) / object3d.sides[l].normal.z) + canvas.center.y;
                if(obj.type == 1)
                    buildLine((s1.x+s3.x)/2, (s1.y+s3.y)/2, debugNormalX, debugNormalY, object3d.lineWidth, {R:0, G:174, B:255, A:0.5});
                else
                    buildLine((s1.x+s2.x+s3.x)/3, (s1.y+s2.y+s3.y)/3, debugNormalX, debugNormalY, object3d.lineWidth, {R:0, G:174, B:255, A:0.5});
            }
        }
    //Now we've averaged (summed up) all normals for each vertex of all triangles.

    //Next: Step 4. (from the steps in LightsAndBumps.js)
        //for each vertex in object
        var q = 0;
        for(var c = 0; c < object3d.scrnSpacePts.length; c++){
            // normalize all vertex normals
            q = object3d.scrnSpacePts[c];
            //q.normal = {'x':q.normal.x/q.sharedTriangles, 'y':q.normal.y/q.sharedTriangles,'z':q.normal.z/q.sharedTriangles};

            q.normal =
                                            translatePoint(
                                                            rotatePoint(
                                                            normalizationVertex(
                                                                q.normal
                                                            )
                                            )
                                        );//{'x':-q.normal.x,'y':-q.normal.y,'z':-q.normal.z}
/*
            q.uvnormal =


                    translatePoint(
                            rotatePoint(
                                normalization(
                                    //{'x':q.normal.x,'y':q.normal.y,'z':q.normal.z}
                                    q.uvnormal
                                )
                            )
                        );
*/
            //q.normal = translatePoint(q.normal);

            //q.normal.x = (((q.normal.x - camera.position.x) * camera.distortion) / q.normal.z) + canvas.center.x;
            //q.normal.y = (((q.normal.y - camera.position.y) * camera.distortion) / q.normal.z) + canvas.center.y;

            //q.normal = {'x' : 1,'y' : 1, 'z' :1};

            //calculate light direction
            var light_direction = sub(light.direction, q);

            //var light_direction = light.direction;//{"x":-q.x, "y":-q.y, "z":-q.z};

            //console.log("subbing: lightDir "+light.direction.x+"]["+light.direction.y+"]["+light.direction.z+"; - with vertexNormal: "+q.x+"]["+q.y+"]["+q.z);
            //var light_direction = sub(normalization(light.direction), q.normal);

            //console.log("light_direction.x: " + light_direction.x + " = light.direction.x: " + light.direction.x + " - q.normal.x: " + q.normal.x );
            //q.diffuseIntensity = Math.round(light.intensity * dot(q.normal, light_direction));

            var nldot = dot(q.normal, light_direction);
            var dt = light.ambientFactor + nldot * light.intensity;// + nldot*nldot*sign * light.intensity;
            if(dt > -25)
                q.diffuseIntensity = Math.max(0, dt);
            else
                q.diffuseIntensity = dt/5;
            //q.diffuseIntensity = Math.max(0, dt);
            //console.log("dot = " + dt );
            //console.log(q.diffuseIntensity);

            if(obj.normals){
                //draw some lines to see what the normals look like (for debugging/demo purposes)
                var degugNormalX = (((q.normal.x - camera.position.x) * camera.distortion) / q.normal.z) + canvas.center.x;
                var degugNormalY = (((q.normal.y - camera.position.y) * camera.distortion) / q.normal.z) + canvas.center.y;
                buildLine(q.x, q.y, degugNormalX, degugNormalY, object3d.lineWidth, {R:(object3d.sides[c].i*245)%255, G:(object3d.sides[c].i*210)%255, B:(object3d.sides[c].i*210)%255, A:1});
                ////buildLine(q.x, q.y, degugNormalX, degugNormalY, object3d.lineWidth, {R:255, G:255, B:255, A:0.5});
                //if(kk == 1)
                //console.log("d1.x= " + d1.x + "; d1.y= " + d1.y + "; d1.normal.x= " + d1.normal.x + "; d1.normal.y= "+ d1.normal.y );
            }
        }
    }





    //here I apply the painter's algorithm, for the first 3 modes
    var sortedTriangles = paintersAlgorithm().reverse();

    //now I draw the lines according to those new transformed points.
    //and also fill the triangles
    for(var k = 0; k < object3d.sides.length; k++)//actually, "for each triangle"
    {
        var kk = sortedTriangles[k].i;
        var d1, d2, d3;

        //in here I'm taking all the points I saved in the first for loop (above),
        // based on the object3d's lines array, so I can connect which point to which line

        if(object3d.type == 1){//"outline"){
            //for each d, I take the i or j of each line in the line array, and it's corresponding processPoint
            d1 = object3d.scrnSpacePts[object3d.lines[kk].i];
            d2 = object3d.scrnSpacePts[object3d.lines[kk].j];
        }
        else if(object3d.type >= 2){//"triangles" or "filled triangles"){
            //for each d, I take the 1st 2nd or 3rd point of each side in the side array, and it's corresponding processPoint
            d1 = object3d.scrnSpacePts[object3d.sides[kk].a];
            d2 = object3d.scrnSpacePts[object3d.sides[kk].b];
            d3 = object3d.scrnSpacePts[object3d.sides[kk].c];
        }

        if(object3d.type > 2 ){//fill the triangle
            if(object3d.type < 5)
                scanLineTriangleFill(d1, d2, d3, {R:(object3d.sides[kk].i*210)%255, G:(object3d.sides[kk].i*245)%255, B:(object3d.sides[kk].i*245)%255, A:1});
            else {//for 5 and above we use z-Buffer. Notice the k instead of kk
                  //no more painter's algorithm
                var nonPainterD1 = object3d.scrnSpacePts[object3d.sides[k].a];
                    //nonPainterD1.u = object3d.sides[k][object3d.sides[k].a].u;
                    //nonPainterD1.v = object3d.sides[k][object3d.sides[k].a].v;
                var nonPainterD2 = object3d.scrnSpacePts[object3d.sides[k].b];
                    //nonPainterD2.u = object3d.sides[k][object3d.sides[k].b].u;
                    //nonPainterD2.v = object3d.sides[k][object3d.sides[k].b].v;
                var nonPainterD3 = object3d.scrnSpacePts[object3d.sides[k].c];
                    //nonPainterD3.u = object3d.sides[k][object3d.sides[k].c].u;
                    //nonPainterD3.v = object3d.sides[k][object3d.sides[k].c].v;

                //console.log("nonPainterD1.z: "+nonPainterD1.z+"; object3d.points[object3d.sides[k].a].z: "+object3d.points[object3d.sides[k].a].z+"; a: "+object3d.sides[k].a+"; u: "+ nonPainterD1.u+"; v: "+nonPainterD1.v);
                if(object3d.type <6){
                    scanLineTriangleFill(nonPainterD1, nonPainterD2, nonPainterD3, {R:(object3d.sides[k].i*210)%255, G:(object3d.sides[k].i*245)%255, B:(object3d.sides[k].i*245)%255, A:1}, object3d.sides[k].normal);
                    //for debug/demo purposes I draw corner boxes for the triangle right now:
                    //buildPoint(nonPainterD1.x, nonPainterD1.y, object3d.pointWidth +d1.colorZ/20, {R:210, G:255+d1.colorZ, B:210+d1.colorZ, A:1});
                    //buildPoint(nonPainterD2.x, nonPainterD2.y, object3d.pointWidth +d2.colorZ/20, {R:210, G:255+d2.colorZ, B:210+d2.colorZ, A:1});
                    //buildPoint(nonPainterD3.x, nonPainterD3.y, object3d.pointWidth +d2.colorZ/20, {R:210, G:255+d2.colorZ, B:210+d2.colorZ, A:1});
                }
                else{
                    //if(nonPainterD1.z <= object3d.sides[k].normal.z || nonPainterD2.z <= object3d.sides[k].normal.z || nonPainterD3.z <= object3d.sides[k].normal.z ){
                    if((nonPainterD1.z + nonPainterD2.z + nonPainterD3.z)/3 >= object3d.sides[k].normal.z-0.1 ){
                        if(obj.type == 1){//for object3ds
                            if(k%2==0){
                                nonPainterD1.u = 1;
                                nonPainterD1.v = 0;
                                nonPainterD2.u = 0;
                                nonPainterD2.v = 0;
                                nonPainterD3.u = 0;
                                nonPainterD3.v = 1;
                            }else{
                                nonPainterD1.u = 0;
                                nonPainterD1.v = 1;
                                nonPainterD2.u = 1;
                                nonPainterD2.v = 1;
                                nonPainterD3.u = 1;
                                nonPainterD3.v = 0;
                            }
                        }
                        else {

                                //var nD1 = ((nonPainterD1.uvnormal));
                                //var nD2 = ((nonPainterD2.uvnormal));
                                //var nD3 = ((nonPainterD3.uvnormal));
        /*
                                console.log("object3d.sides["+k+"]["+object3d.sides[k].a+"].u:"+object3d.sides[k][object3d.sides[k].a].u);
                                console.log("object3d.sides["+k+"]["+object3d.sides[k].a+"].u:"+object3d.sides[k][object3d.sides[k].a].v);
                                console.log("--");
                                console.log("object3d.sides["+k+"]["+object3d.sides[k].b+"].u:"+object3d.sides[k][object3d.sides[k].b].u);
                                console.log("object3d.sides["+k+"]["+object3d.sides[k].b+"].u:"+object3d.sides[k][object3d.sides[k].b].v);
                                console.log("--");
                                console.log("object3d.sides["+k+"]["+object3d.sides[k].c+"].u:"+object3d.sides[k][object3d.sides[k].c].u);
                                console.log("object3d.sides["+k+"]["+object3d.sides[k].c+"].u:"+object3d.sides[k][object3d.sides[k].c].v);
                                console.log("-----");
        */

                                nonPainterD1.u = object3d.sides[k][object3d.sides[k].a].u;
                                nonPainterD1.v = object3d.sides[k][object3d.sides[k].a].v;
                                nonPainterD2.u = object3d.sides[k][object3d.sides[k].b].u;
                                nonPainterD2.v = object3d.sides[k][object3d.sides[k].b].v;
                                nonPainterD3.u = object3d.sides[k][object3d.sides[k].c].u;
                                nonPainterD3.v = object3d.sides[k][object3d.sides[k].c].v;

                                //http://en.wikipedia.org/wiki/UV_mapping
        /*
                                nonPainterD1.u = 0.5 - Math.atan2(nD1.z, nD1.x) / PIx2;
                                nonPainterD1.v = 0.5 - 2* Math.asin(nD1.y) / PIx2;
                                nonPainterD2.u = 0.5 - Math.atan2(nD2.z, nD2.x) / PIx2;
                                nonPainterD2.v = 0.5 - 2* Math.asin(nD2.y) / PIx2;
                                nonPainterD3.u = 0.5 - Math.atan2(nD3.z, nD3.x) / PIx2;
                                nonPainterD3.v = 0.5 - 2* Math.asin(nD3.y) / PIx2;
        */

                                //SLOW
        /*
                                nonPainterD1.u = Math.asin(nD1.x) / Math.PI + 0.5;
                                nonPainterD1.v = Math.asin(nD1.y) / Math.PI + 0.5;
                                nonPainterD2.u = Math.asin(nD2.x) / Math.PI + 0.5;
                                nonPainterD2.v = Math.asin(nD2.y) / Math.PI + 0.5;
                                nonPainterD3.u = Math.asin(nD3.x) / Math.PI + 0.5;
                                nonPainterD3.v = Math.asin(nD3.y) / Math.PI + 0.5;
        */

                                //Fastest but least precise
        /*
                                 nonPainterD1.u = nD1.x / 2 + 0.5;
                                 nonPainterD1.v = nD1.y / 2 + 0.5;
                                 nonPainterD2.u = nD2.x / 2 + 0.5;
                                 nonPainterD2.v = nD2.y / 2 + 0.5;
                                 nonPainterD3.u = nD3.x / 2 + 0.5;
                                 nonPainterD3.v = nD3.y / 2 + 0.5;
        */
                        }
                        //console.log("d1: ["+nonPainterD1.u+"]["+nonPainterD1.v+"]");
                        //console.log("d2: ["+nonPainterD2.u+"]["+nonPainterD2.v+"]");
                        //console.log("d3: ["+nonPainterD3.u+"]["+nonPainterD3.v+"]");
                        //console.log("---");
                        scanLineTriangleFill(nonPainterD1, nonPainterD2, nonPainterD3, null, object3d.sides[k].normal);//{R:150, G:118, B:0, A:obj.transparency});
                    }

                }
            }
        }

        //draw some corner rectangles
        if(object3d.type < 5){
            buildPoint(d1.x, d1.y, object3d.pointWidth +d1.colorZ/20, {R:210, G:255+d1.colorZ, B:210+d1.colorZ, A:1});
            buildPoint(d2.x, d2.y, object3d.pointWidth +d2.colorZ/20, {R:210, G:255+d2.colorZ, B:210+d2.colorZ, A:1});
        }

        if(object3d.type == 1){
            //buildLine(d1.x, d1.y, d2.x, d2.y, object3d.lineWidth);
            buildLine(d1.x, d1.y, d2.x, d2.y, object3d.lineWidth, {R:(object3d.sides[kk].i*210)%255, G:(object3d.sides[kk].i*245)%255, B:(object3d.sides[kk].i*245)%255, A:1});
        }
        else if(obj.normals || (object3d.type >= 2 && object3d.type < 5)){
            //buildLine(d1.x, d1.y, d2.x, d2.y, object3d.lineWidth, {R:210 -object3d.sides[k].i*25, G:245-object3d.sides[k].i*25, B:210-object3d.sides[k].i*25, A:1});
            //buildLine(d2.x, d2.y, d3.x, d3.y, object3d.lineWidth, {R:210 -object3d.sides[k].i*25, G:245-object3d.sides[k].i*25, B:210-object3d.sides[k].i*25, A:1});
            //buildLine(d3.x, d3.y, d1.x, d1.y, object3d.lineWidth, {R:210 -object3d.sides[k].i*25, G:245-object3d.sides[k].i*25, B:210-object3d.sides[k].i*25, A:1});
            buildLine(d1.x, d1.y, d2.x, d2.y, object3d.lineWidth, {R:(object3d.sides[kk].i*245)%255, G:(object3d.sides[kk].i*210)%255, B:(object3d.sides[kk].i*210)%255, A:1}, d1.z, d2.z);
            buildLine(d2.x, d2.y, d3.x, d3.y, object3d.lineWidth, {R:(object3d.sides[kk].i*245)%255, G:(object3d.sides[kk].i*210)%255, B:(object3d.sides[kk].i*210)%255, A:1}, d2.z, d3.z);
            buildLine(d3.x, d3.y, d1.x, d1.y, object3d.lineWidth, {R:(object3d.sides[kk].i*245)%255, G:(object3d.sides[kk].i*210)%255, B:(object3d.sides[kk].i*210)%255, A:1}, d3.z, d1.z);

        }  //mode 4, draws wireframe with boxy pixels, inside buildPixelScanLine(), instead of with ctx.lineTo() like the previous modes;

        //show the light on screen
        if(object3d.type > 5)
            buildCircle(light.direction.x, light.direction.y, 14, {R:255, G:255, B:255, A:0.25});
    }
}

function buildBackgroundLayer(){
    context2d.drawImage(bgImg, 0, 0, bgImg.width, bgImg.height);
}

//drawPoint
function buildPoint(x, y, width, color)
{
    context2d.save();

    if(color){
        context2d.fillStyle = "rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")";
        //console.log("rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")")
    }
    else
        context2d.fillStyle = "rgba(100, 100, 100, 1)";

    //I draw a rectangle instead of a pixel. and centered at its center
    context2d.fillRect(x - width/2, y - width/2, width, width);

    context2d.restore();
}

function buildCircle(x, y, width, color)
{
    context2d.save();

    if(color){
        context2d.fillStyle = "rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")";
        //console.log("rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")")
    }
    else
        context2d.fillStyle = "rgba(100, 100, 100, 1)";

    //I draw a rectangle instead of a pixel. and centered at its center
    //context2d.arc(x - width/2, y - width/2, width*2, Math.PI,0,false);
    //context2d.arc(x - width/2, y - width/2, width*2, Math.PI,0,false);
    context2d.lineWidth = 1;//object3d.lineWidth;

    context2d.beginPath();
    context2d.arc(x , y , width, 0, 2 * Math.PI, false);
    context2d.fill();
    context2d.strokeStyle = "rgba(255, 28, 40, 0.3)";
    context2d.stroke();

    context2d.restore();
}



function buildLine(p1x, p1y, p2x, p2y, width, color, p1z, p2z)
{
    if(object3d.type < 5 || object3d.type > 5){
        drawLine(p1x, p1y, p2x, p2y, width, color);
    }

}

function drawLine(p1x, p1y, p2x, p2y, width, color)
{
    context2d.save();

    context2d.lineCap = "round";
    context2d.lineJoin = "round";
    context2d.lineWidth = width;

    if(color){
        context2d.strokeStyle = "rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")";
        //console.log("rgba(" + color.R + "," + color.G + "," + color.B + "," + color.A + ")")
    }
    else
        context2d.strokeStyle = "rgba(0, 0, 0, 1)";

    context2d.beginPath();

    context2d.moveTo(p1x, p1y);
    context2d.lineTo(p2x, p2y);

    context2d.closePath();
    context2d.stroke();

    context2d.restore();
}
function cameraRotationTick(){
    var d = delta/1000;
    //if (d>1)
        //d = 1;
    //d=1;
    camera.rotation.x += (camera.rotationTickValue*d);
    camera.rotation.y += (camera.rotationTickValue*d);
    camera.rotation.z += (camera.rotationTickValue*d);
    //console.log("camera.rotation.z " + camera.rotation.z + "; d: " + d);
}


//This nice article explains 3d point rotation
// from this awesome assembler program for rotating cubes done in 1995:
//http://www.codeforge.com/read/195501/3d.asm__html
var rad = Math.PI/180;
function rotatePoint(object3dPoint){
    if(isDragging){
        var clickDX= (currentClick.x - previousClick.x)*(rad)*0.05;
        var clickDY= (currentClick.y - previousClick.y)*(rad)*0.05;
        //console.log ("camera.rotationBonus.x: "+camera.rotationBonus.x+"; -= clickDX: "+clickDX);
        //console.log ("camera.rotationBonus.y: "+camera.rotationBonus.y+"; -= clickDy: "+clickDY);
        if(light.isDraggable){
            var a = light.direction.x + clickDX*10;
            var b = light.direction.y + clickDY*10;
            if(a>0&&a<canvas.width)
                light.direction.x = a;
            if(b>0&&b<canvas.height)
                light.direction.y = b;
        } else {
            var c = camera.motionBonus.x + clickDX;
            var d = camera.motionBonus.y + clickDY;
            if(c>-4.5&&c<4.5)
                camera.motionBonus.x = c;
            if(d>-3&&d<3)
                camera.motionBonus.y = d;
        }
    }

    //rotation around x axis
    var yt = object3dPoint.y * Math.cos(camera.rotation.x) - object3dPoint.z * Math.sin(camera.rotation.x);
    var zt = object3dPoint.y * Math.sin(camera.rotation.x) + object3dPoint.z * Math.cos(camera.rotation.x);
    object3dPoint.y = yt;
    object3dPoint.z = zt;

    //rotation around y axis
    var xt = object3dPoint.x * Math.cos(camera.rotation.y) - object3dPoint.z * Math.sin(camera.rotation.y);
    zt = object3dPoint.x * Math.sin(camera.rotation.y) + object3dPoint.z * Math.cos(camera.rotation.y);
    object3dPoint.x = xt;
    object3dPoint.z = zt;

    //rotation around z axis
    xt = object3dPoint.x * Math.cos(camera.rotation.z) - object3dPoint.y * Math.sin(camera.rotation.z);
    yt = object3dPoint.x * Math.sin(camera.rotation.z) + object3dPoint.y * Math.cos(camera.rotation.z);
    object3dPoint.x = xt;
    object3dPoint.y = yt;


    return {'x':object3dPoint.x + camera.motionBonus.x, 'y':object3dPoint.y + camera.motionBonus.y, 'z':object3dPoint.z };
}


//translate object to match the "camera"; matching the object's rotation
function translatePoint(object3dPoint){
    object3dPoint.x -= camera.position.x;
    object3dPoint.y -= camera.position.y;
    object3dPoint.z -= camera.position.z;

    //return {'x':object3dPoint.x - camera.rotationBonus.x, 'y':object3dPoint.y - camera.rotationBonus.y, 'z':object3dPoint.z };
    return object3dPoint;
}

