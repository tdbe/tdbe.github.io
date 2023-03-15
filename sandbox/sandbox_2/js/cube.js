

var cube = {
            'color': {R:150, G:118, B:0, A:1}, //Change A: to .1 or something, to test the backface culling
            'lineWidth' : 1,//line thickness
            'pointWidth' : 14,
            'points' :
                        [   //TODO: get some coordinates from a more interesting .obj
                            //The uv information for the cube is generated through code.
                            //the following data is more or less like the .obj format.
                            {x:1, y:1, z:-1, normal: {x:0, y:0, z:0}
                            },
                            {x:1, y:-1, z:-1, normal: {x:0, y:0, z:0}
                            },
                            {x:-1, y:-1, z:-1, normal: {x:0, y:0, z:0}
                            },
                            {x:-1, y:1, z:-1, normal: {x:0, y:0, z:0}
                            },
                            {x:1, y:1, z:1, normal: {x:0, y:0, z:0}
                            },
                            {x:1, y:-1, z:1, normal: {x:0, y:0, z:0}
                            },
                            {x:-1, y:-1, z:1, normal: {x:0, y:0, z:0}
                            },
                            {x:-1, y:1, z:1, normal: {x:0, y:0, z:0}
                            }//

                            //mutation
							//{x:-1.5, y:1.5, z:1, normal: {x:0, y:0, z:0}},
                            //{x:-1, y:-1, z:-1, normal: {x:0, y:0, z:0}}
                            /*
                            { u:0, v:0},
                            { u:0, v:1},
                            { u:1, v:1},
                            { u:1, v:0},
                            { u:1, v:0},
                            { u:1, v:1},
                            { u:0, v:1},
                            { u:0, v:0}
                            */
                        ],
            'lines' : [ //which point to which point (from the indices of the above array)
                           //has a line between them (this includes diagonals, for the triangles)
                            {i:0, j:1},
                            {i:0, j:4},

                            {i:1, j:2},
                            {i:1, j:5},

                            {i:2, j:3},
                            {i:2, j:6},

                            {i:3, j:0},
                            {i:3, j:7},

                            {i:4, j:5},
                            {i:5, j:6},
                            {i:6, j:7},
                            {i:7, j:4}//
                            //mutation
							//{i:8, j:7},
                            //{i:8, j:9},
							//{i:9, j:7}
                        ],
            "scrnSpacePts" : [],
            'type' : 1,
            'sides' : [ // w/ triangles

                        // a, b and c are indexes, not coordinates. They tell us which coordinates from points they belong to.
                        //i indicates which side this is.
                        //frontFace
                        { a:0, b:1, c:2, i:1, normal: {x:0, y:0, z:0}//the normal is just declared here.--the surface normal will be stored here after computing it.
                          //,'0':{u:0, v:0}, '1':{u:1, v:0}, '2':{u:0, v:1}
                        },
                        { a:2, b:3, c:0, i:1, normal: {x:0, y:0, z:0}
                          //,'2':{u:0, v:1}, '3':{u:1, v:0}, '0':{u:1, v:1}
                        },

                        //top
                        { a:1, b:5, c:6, i:2, normal: {x:0, y:0, z:0}
                          //,'1':{u:0, v:0}, '5':{u:1, v:0}, '6':{u:0, v:1}
                        },
                        { a:6, b:2, c:1, i:2, normal: {x:0, y:0, z:0}
                          //,'6':{u:0, v:1}, '2':{u:1, v:0}, '1':{u:1, v:1}
                        },

                        //back
                        { a:5, b:4, c:7, i:3, normal: {x:0, y:0, z:0}
                          //,'5':{u:0, v:0}, '4':{u:0, v:1}, '7':{u:1, v:0}
                        },
                        { a:7, b:6, c:5, i:3, normal: {x:0, y:0, z:0}
                          //,'7':{u:1, v:0}, '6':{u:0, v:1}, '5':{u:1, v:1}
                        },

                        //bottom
                        { a:4, b:0, c:3, i:4, normal: {x:0, y:0, z:0}
                          //,'4':{u:0, v:0}, '0':{u:0, v:1}, '3':{u:1, v:0}
                        },
                        { a:3, b:7, c:4, i:4, normal: {x:0, y:0, z:0}
                          //,'3':{u:1, v:0}, '7':{u:0, v:1}, '4':{u:1, v:1}
                        },

                        //right
                        { a:3, b:2, c:6, i:5, normal: {x:0, y:0, z:0}
                          //,'3':{u:0, v:0}, '2':{u:1, v:0}, '6':{u:0, v:1}
                        },
                        { a:6, b:7, c:3, i:5, normal: {x:0, y:0, z:0}
                          //,'6':{u:0, v:1}, '7':{u:1, v:0}, '3':{u:1, v:1}
                        },

                        //left
                        { a:5, b:1, c:0, i:6, normal: {x:0, y:0, z:0}
                          //,'0':{u:0, v:0}, '5':{u:0, v:1}, '1':{u:1, v:0}
                        },
                        { a:0, b:4, c:5, i:6, normal: {x:0, y:0, z:0}
                          //,'0':{u:1, v:0}, '4':{u:0, v:1}, '5':{u:1, v:1}
                        }//
						
						//mutation
                        //{ a:7, b:8, c:9, i:7, normal: {x:0, y:0, z:0} },
                        //{ a:8, b:9, c:6, i:8, normal: {x:0, y:0, z:0} }
                     ]

           };


/*
 {x:-1, y:-1, z:1, normal: {x:0, y:0, z:0}
 //, uv:{ u:0, v:0}
 },
 {x:-1, y:1, z:1, normal: {x:0, y:0, z:0}
 //, uv:{ u:0, v:1}
 },
 {x:1, y:1, z:1, normal: {x:0, y:0, z:0}
 //, uv:{ u:1, v:1}
 },
 {x:1, y:-1, z:1, normal: {x:0, y:0, z:0}
 //, uv:{ u:1, v:0}
 },
 {x:-1, y:-1, z:-1, normal: {x:0, y:0, z:0}
 //, uv:{ u:1, v:0}
 },
 {x:-1, y:1, z:-1, normal: {x:0, y:0, z:0}
 //, uv:{ u:1, v:1}
 },
 {x:1, y:1, z:-1, normal: {x:0, y:0, z:0}
 //, uv:{ u:0, v:1}
 },
 {x:1, y:-1, z:-1, normal: {x:0, y:0, z:0}
 //, uv:{ u:0, v:0}
 }//

 */

/*
function findLoneVertex(currentTriangle, previousTriangle){
        for(var i= 0; i<currentTriangle.length; i++){

            for (var j= 0; j<previousTriangle.length; j++ ){
                if(currentTriangle[i].x != previousTriangle[j].x){

                }else if(currentTriangle[i].y != previousTriangle[j].y){

                }

            }

        }

}
    */