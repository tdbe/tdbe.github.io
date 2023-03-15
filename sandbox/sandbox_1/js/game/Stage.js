/**
 * Created with JetBrains WebStorm.
 * User: tdbe
 * Date: 07-09-12
 * Time: 11:35
 * To change this template use File | Settings | File Templates.
 */

/*
 Author: Tudor Berechet. All the code below is mine, unless I specify otherwise in a //comment.
*/

var enemyYO = 0;
var boxYO= 0;

// I am simulating the Flash pattern of a Stage with Sprites.
// When I render the scene, I will take all elements (Sprites) on Stage and Draw them using WebGL.
function Stage (canvas, contextGL, images) {

    this.children = new Array();
    //var tick = 0;

    this.addChild = function(item){
        this.children.push(item);
    };

    this.getChildAt = function(i){
        return this.children[i];
    };

    this.getChildByName = function(name){
        for(var i=0; i<this.children.length; i++){
            if(this.children[i].name == name)
                return this.children[i];
        }
    };

    this.getChildIndexByName = function(name){
        for(var i=0; i<this.children.length; i++){
            if(this.children[i].name == name)
                return i;
        }
    };

    this.removeChildAt = function(i){
        this.children.splice(i, 1);
    };

    this.addChildAt = function(child, i){
        this.children.splice(i, 0, child);
    };

    this.count = function(){
        return this.children.length;
    };

    this.render = function(delta, stage, playerInput){

        // TODO: If children don't have DisplayObject data and have children, iterate through their children and render them
        draw(delta, stage, playerInput);
    };

    var restoreCount;
    var stage;
    function draw(delta, instance, playerInput) {
        stage= instance;
        var camera = stage.getChildAt(2);
        restoreCount = 0;

        contextGL.save();
        contextGL.translate(-camera.x/6, camera.y/6);//BACKGROUND CAMERA HERE
        buildBackgroundLayer();


        restoreContext(1);
        buildTheSun(stage.getChildAt(1).x, stage.getChildAt(1).y, stage.getChildAt(1).haloOn);


        contextGL.save();
        restoreCount++;
        contextGL.translate(-camera.x, camera.y);//CAMERA HERE
        if(camera.x!=0)
        //alert(-camera.x);

        var sprite;
        for(var i=3; i<stage.count()-1; i++){
            sprite = stage.getChildAt(i);
            if(sprite.displayObject.type == "spriteArray"){
                for(var j=0; j<sprite.count(); j++){
                    //TODO: add recursion like in the clone() override
                    contextGL.drawImage(sprite.getChildAt(j).displayObject.data, sprite.getChildAt(j).x, sprite.getChildAt(j).y);
                }
            }
            else if(sprite.name == "player"){
                var flip = 0;
                //if(sprite.xVelocity < 0){
                if(sprite.lastHeading == "left" && playerInput.right != "down" || sprite.lastHeading == "right" && playerInput.left == "down"){
                    flip = sprite.jugglerCoords.stand.height;
                }

				//if(sprite.hit){
				//	contextGL.globalAlpha = 0.5;
				//	contextGL.save();
				//}
				
                if(sprite.jumping && !sprite.falling || sprite.yVelocity < 0){
					
                    contextGL.drawImage(sprite.displayObject.data, sprite.jugglerCoords.jump.x, sprite.jugglerCoords.jump.y + flip,
                                        sprite.jugglerCoords.jump.width, sprite.jugglerCoords.jump.height, sprite.x, sprite.y,
                                        sprite.jugglerCoords.jump.width, sprite.jugglerCoords.jump.height);
                    //context.drawImage(img,sx,sy,swidth,sheight,x,y,width,height);

                } else if(sprite.yVelocity > 0 && !sprite.hasLanded || sprite.y > sprite.prevY + 2 ){
                    contextGL.drawImage(sprite.displayObject.data, sprite.jugglerCoords.fall.x, sprite.jugglerCoords.fall.y + flip,
                                        sprite.jugglerCoords.fall.width, sprite.jugglerCoords.fall.height, sprite.x, sprite.y,
                                        sprite.jugglerCoords.fall.width, sprite.jugglerCoords.fall.height);
                }
                  else if(playerInput.right == "down" || playerInput.left == "down"){
                    switchJugglers(delta, sprite, flip);

                }

                else{
                    contextGL.drawImage(sprite.displayObject.data, sprite.jugglerCoords.stand.x, sprite.jugglerCoords.stand.y + flip,
                                        sprite.jugglerCoords.stand.width, sprite.jugglerCoords.stand.height, sprite.x, sprite.y,
                                        sprite.jugglerCoords.stand.width, sprite.jugglerCoords.stand.height);
                    //contextGL.drawImage(sprite.displayObject.data, sprite.x, sprite.y);
                }
				



                //TODO: replace all the .hit ifs with just one common if. Each hittable sprite must have a [hit] image in it's sprite sheet
                if(sprite.hit){
				
					//contextGL.globalAlpha = 1;
					//contextGL.restore();
				
                    console.log("player with topleft["+ sprite.x+"]["+sprite.y+"] was hit by enemy");
                    //contextGL.drawImage(sprite.displayObject.data, sprite.x, sprite.y);//, sprite.width, sprite.height);
                    sprite.hit = false;
                }
                //contextGL.drawImage(sprite.displayObject.data, sprite.x + sprite.hitMarginX, sprite.y + sprite.hitMarginY, 16, 16);
            } else if(sprite.name == "enemy"){
                if(sprite.hit){
                    console.log("enemy with topleft["+ sprite.x+"]["+sprite.y+"] was hit by player");
                    //TODO: webgl invert image colors
					//contextGL.globalAlpha = 0.5;
					//contextGL.save();
					if(enemyYO <5)
						enemyYO = 10;
                    contextGL.drawImage(sprite.displayObject.data, sprite.x, sprite.y+enemyYO);//, sprite.width, sprite.height);
                    sprite.hit = false;
					//contextGL.restore();
                } else{
					if(enemyYO>0)
						enemyYO--;
                    contextGL.drawImage(sprite.displayObject.data, sprite.x, sprite.y+enemyYO);
					}
            }else if(sprite.name == "red" || sprite.name == "green" || sprite.name == "blue"){
                if(sprite.hit){
				
					if(boxYO >-5)
						boxYO = -10;
                    console.log("r/g/b block with topleft["+ sprite.x+"]["+sprite.y+"] was hit by player");
                    //TODO: webgl invert image colors
                    contextGL.drawImage(sprite.displayObject.data, sprite.x, sprite.y+boxYO);//, sprite.width, sprite.height);
                    sprite.hit = false;
                } else{
				
					if(boxYO<0)
						boxYO++;
                    contextGL.drawImage(sprite.displayObject.data, sprite.x, sprite.y);//+boxYO //no UID
					}
            }
            else
                contextGL.drawImage(sprite.displayObject.data, sprite.x, sprite.y);

        }
        //var img = Object.create(Stage, this.children[0]);


        restoreContext(restoreCount);

        var heart = stage.getChildAt(stage.count()-1);
        contextGL.drawImage(heart.displayObject.data, heart.x, heart.y);
        //restoreContext(1);


    }

    var spriteModel = null;
    var sweitch = true;
    var accumulatedDelta = 0;
    function switchJugglers(delta, sprite, flip){

        if(accumulatedDelta > 150 || !spriteModel){
            accumulatedDelta = 0;
            if(sweitch){
                sweitch = false;
                spriteModel = sprite.jugglerCoords.runStand;
            }
            else {
                sweitch = true;
                spriteModel = sprite.jugglerCoords.runRun;
            }
        }
        else {
            accumulatedDelta += delta;
        }

        //console.log(delta);

        contextGL.drawImage(sprite.displayObject.data, spriteModel.x, spriteModel.y + flip,
            spriteModel.width, spriteModel.height, sprite.x, sprite.y,
            spriteModel.width, spriteModel.height);
    }

    function buildBackgroundLayer(){
        //ctx.colorMask(1, 1, 1, 1);
        //contextGL.fillStyle = "rgb(50, 0, 50)";
        //contextGL.fillRect(0, 0, canvas.width, canvas.height);
        contextGL.drawImage(stage.children[0].displayObject.data, stage.children[0].x, stage.children[0].y, stage.children[0].width, stage.children[0].height);


    }

    function buildTheSun(sunX, sunY, haloOn){//how dramatic...
        if(haloOn){
            buildSpinningSquares(0, 0, 160, 190, 50, 0.008, sunX, sunY);
            buildSpinningSquares(0, 0, 110, 130, 50, 0.005, sunX, sunY);
        }
        buildSpinningSquares(0, 0, 60, 70, 50, 0.005, sunX, sunY, true);
        buildSpinningSquares(0, 0, 10, 10, 50, 0.03, sunX, sunY, true);
    }

    function buildSpinningSquares(x, y, width, height, amount, fade, sunX, sunY, reverse){
        //var speed = tick + 0.4;
        var speed = tick + 0.8;
        //Note that these squares below are a modified version of one of the examples in the webgl-2d library: https://github.com/gameclosure/webgl-2d
        contextGL.save();
        //restoreCount++;
        contextGL.translate(sunX, sunY);
        if(reverse)
            contextGL.rotate(Math.PI/180 /speed);//Math.PI/2);
        else
            contextGL.rotate(speed * Math.PI/180);//Math.PI/2);
        contextGL.save();

        //the reason this color (255, 225, 0) shines white is that the canvas is set to use alpha (and the canvas bg is white), in webgl-2d.js at line 282
        contextGL.fillStyle = "rgba(255, 225, 0, "+fade.toString()+")";

        for(var i = 0; i < amount; i++) {//50 for 100px
            contextGL.scale(2,2);
            contextGL.fillRect(x, y, width, height);//-25 -25
            contextGL.scale(.5, .5);
            //ctx.rotate(tick * Math.PI/180);
            contextGL.rotate(-2*Math.PI/50);
        }

        restoreContext(3);
    }

    function buildImageSprites(){

        restoreCount++;
    }

    function buildVectorSprites(){

        restoreCount++;
    }

    function restoreContext(x){
        for(var r=0; r<x; r++){
            contextGL.restore();

        }
    }
};





//Sprites will represent all visual game elements and their properties.
function Sprite (data, type, name, x, y, width, height, no) {
    this.hitMarginX = 0;
    this.hitMarginY = 0;
    this.name = name;
    this.type = type;
    this.displayObject = {
                            type: type,
                            data: data,
                            name: name,
                            processInfo: function () {
                                //return; // don't mind this
                            }
                        };
    this.width = width;//I may want the image to be smaller than the sprite
    this.height = height;
    this.x = x;
    this.y = y;
    //I'll just create other attributes (for specific game objects) on the fly, since this is javascript... :D

    this.createChildrenRow = function(thees){
        if(type == "spriteArray" && no){
            var prevX = x; //- thees.displayObject.data.width;
            var prevY = y;
            thees.width = 0;

            var s = new Sprite(data, "image", thees.displayObject.name,
                prevX , prevY,
                thees.displayObject.data.width, thees.displayObject.data.height
            );
            thees.addChild(s); //alert(s.x);
            thees.width += s.width;

            for(var i=1; i<no; i++){
                var s = new Sprite(data, "image", thees.displayObject.name,
                                   prevX + thees.displayObject.data.width, prevY,
                                   thees.displayObject.data.width, thees.displayObject.data.height
                                    );
                thees.addChild(s); //alert(s.x);
                prevX = s.x;
                prevY = s.y;
                thees.width += s.width;
            }
        } else { console.log("bad createChildrenRow call!! ___________________________________________");}
    };

    this.moveTo = function (thees, _x, _y){

        if(type == "spriteArray" && no){
            //var prevX = thees.x = _x || x;//(_x ?_x - data.width : x - data.width);//- data.x);
            //var prevY = thees.y = (_y ? _y : y); //we usually won't want to move platforms vertically, but we can
            thees.x = _x;
            thees.y = _y || y;
            //var prevX = _x;//(_x ?_x - data.width : x - data.width);//- data.x);
            //var prevY = _y; //we usually won't want to move platforms vertically, but we can

            thees.children[0].x = _x;
            thees.children[0].y = thees.y;

            for(var i=1; i<no; i++){
                //alert(thees.children[0].x);
                thees.children[i].x = thees.children[i-1].x + data.width;
                thees.children[i].y = thees.y;
                //prevX = thees.children[i].x;
                //prevY = thees.children[i].y;
            }
        }else { console.log("bad moveTo call!! ___________________________________________");}
    };

    //scale sprite up or down, preserving aspect ratio.
    this.scale = function(multiplier){
        if(this.displayObject.data){

            var imgW = this.displayObject.data.width;
            var imgH = this.displayObject.data.height;
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

            this.width = this.displayObject.data.width = imgW;
            this.height = this.displayObject.data.height = imgH;


        }
        else{
            document.write("Error! sprite's display object data is null.");
        }
    };




    this.children = new Array();

    this.addChild = function(item){
        this.children.push(item);
    };

    this.getChildAt = function(i){
        return this.children[i];
    };

    this.getChildByName = function(name){
        for(var i=0; i<this.children.length; i++){
            if(this.children[i].name == name)
                return this.children[i];
        }
    };

    this.getChildIndexByName = function(name){
        for(var i=0; i<this.children.length; i++){
            if(this.children[i].name == name)
                return i;
        }
    };

    this.removeChildAt = function(i){
        this.children.splice(i, 1);
    };

    this.addChildAt = function(child, i){
        this.children.splice(i, 0, child);
    };

    this.count = function(){
        return this.children.length;
    };

};