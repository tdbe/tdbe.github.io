

/*
<Further customization parameters for the Target (yellow)>
*/
var doesTargetPatrol = false; //does the yellow guy randomly patrol around while waiting for an enemy?
function handlePatrol(checkbox){
    mouse_sp.doesItPatrol = doesTargetPatrol = checkbox.checked;
    console.log("[mouse] Target patrols: " + checkbox.checked);
}

var defaultTrailBool = true;
function handleTrail(checkbox){
    mouseTrail_sp.isEnabled = checkbox.checked;
    console.log("[mouse] Target trail enabled: " + checkbox.checked);
}

var targetRadarDistanceInTiles = 3;//how many tiles away can the target see? (if an enemy is approaching)
function handleRadar(checkbox){
    if(!isNaN(checkbox.value)){
        var val = Math.abs(Math.round(checkbox.value));
        mouse_sp.radarDistance = val;
        console.log("[mouse] Target radar radius set to: " + val);
    }
}
/*
 </Further customization parameters for the Target (yellow)>
*/



var tileGrid = [];

function initGrid(){
    for (var i=0; i<=22; i++ ){
        tileGrid[i] = [];
    }

}
initGrid();



function Sprite (data, name, x, y, width, height) {
    this.name = name;

    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;

    this.data = data;
    //any other attributes are created dynamically for convenience, because Javascript.

    //scale sprite up or down, preserving aspect ratio.
    this.scale = function(multiplier){
        if(this.data){

            var imgW = this.width;
            var imgH = this.height;
            var ratio = imgW / imgH;

            if(imgW<imgH){
                imgH *= multiplier;
                imgW = imgH*ratio;
            }
            else
            {
                imgW *= multiplier;
                imgH = imgW*ratio;
            }

            this.width = imgW;
            this.height = imgH;


        }
        else{
            document.write("Error! sprite's image data is null.");
        }
    };


};