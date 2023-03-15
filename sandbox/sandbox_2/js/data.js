
/*

Here we have the data used in order to render the selected 3d object. The object data itself is in cube.js and in icosahedron.js

 */


//NOTE: there is no real camera. It is the object that translates/rotates, not the 'camera'.
var camera = {
                'position' : {
                                'x' : 0, //top
                                'y' : 0, //left
                                'z' : -5.5//-5.5
                             },
                'rotation' : {//not
                                'x' : 0,
                                'y' : 0,
                                'z' : 0
                             },
                'rotationTickValue' : 0.2,
                'distortion' : 320,
                "motionBonus": {'x':0, 'y':0}
            };

//the light source and it's direction. it is a point source directional light.
var light = {
    'isDraggable':false,
    /*
    'position' : {
        'x' : 400, //top
        'y' : 280, //left
        'z' : -2
    },*/
    'direction' : {
        'x' : 400,//2//1.5
        'y' : 280,//2//1.5
        'z' : -2//-2//-1.5
    },
    'intensity' : 0.5,//15//5//0.05
    'ambientFactor' : 10//,//50//54
    //'color': {R:0, G:255, B:255, A:1}
};

var texture = [];
/*
var texture = {
                "data": null,
                "width":0,
                "height":0
            };
*/

var object3d;
var obj = {'type': 2, 'normals': false, 'transparency':1, 'txt':1,  'fixedVertexNormalWeights': false, 'bump': false, 'bump2': false, 'bump3': true};
//var forceShowOutline = true;
//var forceInnerNormals = true;
function handleNormals(checkbox){
    if(object3d.type > 5){
        obj.normals = checkbox.checked;
        console.log("Force-displaying normals and wireframe: " + checkbox.checked);
    } else{
        checkbox.checked = false;
        console.log("This option only works for modes 6 and up (where lighting is enabled).");
    }
}

function handleLight(checkbox){
    if(object3d.type > 5){
        light.isDraggable = checkbox.checked;
        console.log("You can drag the light instead of the object: " + checkbox.checked);
    } else{
        checkbox.checked = false;
        console.log("This option only works for modes 6 and up (where lighting is enabled).");
    }
}

var previousVal = 1.0;
function handleTransparency(checkbox){

    if(!isNaN(checkbox.value) && object3d.type > 5){
        var val = Math.abs(checkbox.value);

        if (val >0.5 && previousVal == 0.5){
            val = 1;
            checkbox.value = 1;
        }
        else if(val <0.95 && previousVal == 1){
            val = 0.5;
            checkbox.value = 0.5;
        }
        previousVal = val;

        obj.transparency = val;
        object3d.color.A = val;
        console.log("Transparency set to: " + val);
    }
     else{
        checkbox.value = obj.transparency;
        console.log("This option only works for modes 6 and up (where lighting is enabled).");
    }
}

function handleBump(checkbox){
    if(object3d.type > 6){
        obj.bump = checkbox.checked;
        if (obj.bump == false){
            document.getElementById('bmp2').checked = false;
            obj.bump2 = false;
        }
        console.log("Per Pixel ScanLineShading is active: " + checkbox.checked);
        if(object3d.type == 7 && checkbox.checked){
            obj.txt = 0;
            document.getElementById('color').checked = true;
        }

    } else{
        checkbox.checked = false;
        console.log("This option only works for modes 6 and up (where lighting is enabled).");
    }
}

function handleBump2(checkbox){
    if(object3d.type > 6){

        if (obj.bump == false && checkbox.checked){
            document.getElementById('bmp').checked = true;
            obj.bump = true;
            obj.bump2 = true;
        } else
            obj.bump2 = checkbox.checked;

        console.log("BumpMap is active: " + checkbox.checked);
        if(object3d.type == 7 && checkbox.checked){
            obj.txt = 0;
            document.getElementById('color').checked = true;
        }

        if(obj.bump3){
            obj.type = 1; object3d = cube; obj.fixedVertexNormalWeights = true;
            document.getElementById('cube2').checked = true;
            console.log("3D Object changed to Cube, for performance reasons. Also, it is easier to read the GreenMagenta points here. BUT you are free to switch to the icosahedron as well.")
        }

    } else{
        checkbox.checked = false;
        console.log("This option only works for modes 6 and up (where lighting is enabled).");
    }
}

function handleBump3(checkbox){
    if(obj.bump2 == true){

        obj.bump3 = checkbox.checked;

        if(!obj.bump3){
            obj.type = 2; object3d = icosahedron; obj.fixedVertexNormalWeights = false;
            document.getElementById('icos').checked = true;
        }

        console.log("BumpMap Normals are being rendered: " + checkbox.checked);


    } else{
        checkbox.checked = !checkbox.checked;
        console.log("This option only works for mode 9 (it's a debug feature).");
    }
}