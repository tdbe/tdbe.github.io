/*
    Author: Tudor Berechet. All the code below is mine, unless I specify otherwise in a //comment.
 */

//todo: sounds, paused game message, brick reaction when hit from below.


var tick = 0.0;
function Game (canvas, contextGL, images) {
    //the grid will be split into 16x16px blocks
    //since my "level" is around 5600px wide and 544px tall,
    //we will have a tileGrid[350][34]; sounds reasonable enough.
    //the tile grid either holds a reference to the object if there is an object there, (if it happens that there are more than 1 objects in the same tile, I will just hold the reference of one of them, because they will surely both be non-interactive terrain in that case; same outcome)
    //either is null or undefined; (because Javascript)
    var tileGrid = [];


    //this draws an extra ~1000 outline sprites to stage, showing the grid around each element's hit box
    //NOTE: Debug mode is BUGGY :) it might break some stuff as I implemented it in a hurry
    var doDebug = false;//true;

    playerInput = {
        'left': "",
        'right': "",
        'up': ""
    };


    $(document).ready(function() {/*
        http://mikemurko.com/general/jquery-keycode-cheatsheet/
        $(document).bind('keypress',function(e){
            var code = (e.keyCode ? e.keyCode : e.which);
            if(code == 39) {
                playerInput.right = "press";
            }
            else if(code == 37) {
                playerInput.left = "press";
            }
            else if(code == 38) {
                playerInput.up = "press";
            }
             e.cancelBubble = true;
             e.returnValue = false;
        });*/
        //$('body').on('keydown','canvas', function(e){alert();
        $(document).bind('keydown',function(e){
            var code = (e.keyCode ? e.keyCode : e.which);
            if(code == 39) {
                playerInput.right = "down";
            }
            else if(code == 37) {
                playerInput.left = "down";
            }
            else if(code == 38) {
                playerInput.up = "down";
            }

            e.cancelBubble = true;
            if( e.preventDefault )
                e.preventDefault();
                //e.stopPropagation();
                //e.stopImmediatePropagation();
        });
        //$('body').on('keyup','canvas', function(e){
        $(document).bind('keyup',function(e){
            var code = (e.keyCode ? e.keyCode : e.which);

            if(code == 39) {
                playerInput.right = "up";
            }
            else if(code == 37) {
                playerInput.left = "up";
            }
            else if(code == 38) {
                playerInput.up = "up";
            }

            e.cancelBubble = true;
            if( e.preventDefault )
                e.preventDefault();
                //e.stopPropagation();
                //e.stopImmediatePropagation();
        });
        $(window).click(resume);
        $(window).focus(resume);
        $(window).blur(pause);
    });


    var isPaused = false;
    var yAcceleration = -10;//-10;
    var gravitationalAcceleration = 800;//600;
    var jumpSpeed = 400;//400
    var smallJump = 20;//20
    var normalJump = 102;//102
    var maxSpeed = 300;
    var accelerate = 550;//350;
    var decelerate = -750;//-550;

    /*
    var derivative = {
        'x': 0.0, //derivative of position = velocity
        'velocity': 0.0 //derivative of Velocity = acceleration
    };
    */

    var stage;
    var delta, current, previous = 0;
	var frameCount = 0;

    var player, enemy, sun, camera, debug;
    var floor = new Array(0, 0);

    var playerSpriteWidth = 79;
    var playerSpriteHeight = 98;

    //var gameInterval;
    this.start = function(){
        stage = new Stage(canvas, contextGL, images);

        createGameWorld(images);

        //for(var i=-560; i< 5824; i += 16){
        /*
        for(var i=-752; i< 6237; i += 16){
            tileGrid[i] = new Array();
            for(var j=-256; j<= 512; j++)
                tileGrid[i][j] = new Object();
        }
*/
        //p = stage.getChildIndexByName("player");
        //stage.children[p].xVelocity = 0.0;
        //stage.children[p].yVelocity = 0.0;
        //stage.children[p].acceleration = 0.0;
        player = stage.getChildByName("player");
        player.xVelocity = 0;
        player.yVelocity = 0;
        player.xAcceleration = 0;
        player.yAcceleration = 0;
        player.lastHeading = null;
        player.jumping = false;
        player.falling = false;
        //player.peaked = false;
        player.jumpHeightDelimiter = 102;//145;//note: jump height is also influenced by how much the gravitationalAcceleration drags you down.
        player.fallXAcceleration = 10;//a flying player would have a higher number. they would change direction while in the air faster.
        player.jumpCount = 0;
        player.jumpCountLimit = 2;
        player.jumpAllowed = true;
        player.jumpY = 0;
        player.prevX = player.x;
        player.prevY = player.y;
        player.hasLanded = false;
        //player.stopped = false;
        //player.touchedSomething = false;
        player.lastCollided = {
                                'left' : false,
                                'right' : false,
                                'top' : false

                              };
        player.jugglerCoords = { //structception
                                'jump' : { 'x' : 0, 'y' : 0, 'width' : playerSpriteWidth, 'height' : playerSpriteHeight },
                                'fall' : { 'x' : playerSpriteWidth, 'y' : 0, 'width' : playerSpriteWidth, 'height' : playerSpriteHeight },
                                'stand' : { 'x' : playerSpriteWidth*2, 'y' : 0, 'width' : playerSpriteWidth, 'height' : playerSpriteHeight },
                                'runStand' : { 'x' : playerSpriteWidth*3, 'y' : 0, 'width' : playerSpriteWidth, 'height' : playerSpriteHeight },
                                'runRun' : { 'x' : playerSpriteWidth*4, 'y' : 0, 'width' : playerSpriteWidth, 'height' : playerSpriteHeight }
                                };//note to self: the flipped versions of each sprite are at y += playerSpriteHeight

        //gameInterval = setInterval(gameLoop, 1000/30);


        setTimeout(function(){element = document.getElementById("msg");
        element.parentNode.removeChild(element);}, 1000);
		
        gameLoop();
    };

    function pause(){
        if(!isPaused){
            //clearInterval(gameInterval);
            //window.cancelAnimationFrame(gameLoop);
            isPaused = true;//alert("paused");
            console.log("Is Game Paused: " + isPaused);
        }
    }

    function resume(){
        if(isPaused){
            //window.cancelAnimationFrame();
            isPaused = false;
            console.log("Is Game Paused: " + isPaused);
        }
    }


    /*

        load images[] into sprites here.
        generateMap : position all sprites (the game world)

     */
    //create Sprites and Sprites with children (groups of bricks etc.)
    function createGameWorld(images){
        /*
        for(var i=0; i<images.length; i++){
            stage.addChild(new Sprite(images[i], "image", getName(images[i])));
        }
        */
        for (var i=-25; i<=350; i++ ){
            tileGrid[i] = [];
        }

        debug = images[0];

        for(var i=1; i<images.length; i++){
            var name = getName(images[i]);
            //console.log(name);

            if (name == "player"){
                player = new Sprite(images[i], "image", name,
                                    0, 0,
                                    images[i].width, images[i].height
                                  );
                //player.scale(0.5);
                player.x = 100;
                player.y = canvas.height - s.height -150;//30
                player.width = 32 ;
                player.height = 96;
                player.hitMarginX = 28 ;//(images[i].width - 32)/2;
                player.hitMarginY = 2;//(images[i].height - 96)/2;
                //stage.addChild(player);

            } else if (name == "enemy"){
                var s = new Sprite(images[i], "image", name,
                                    0, 0,
                                    images[i].width, images[i].height
                                  );
                //s.scale(0.5);
                s.x = canvas.width - s.width - 140 ;
                s.y = canvas.height - s.height -30;
                s.width = Math.round(images[i].width * 0.8);
                s.height = Math.round(images[i].height * 0.8);
                s.hitMarginX = (images[i].width - s.width)/2;
                s.hitMarginY = (images[i].height - s.height);
                stage.addChildAt(s, 1);
                addToTileGrid(s);
                enemy = s;
                enemy.xVelocity = 10;
                //enemy.prevX = enemy.x;
                //enemy.prevY = enemy.y;

            } else if (name == "bg"){
                var s = new Sprite(images[i], "image", name,
                                    0, -200,
                                    //canvas.width, canvas.height
                                    images[i].width, images[i].height
                                   );
                //stage.addChild(s);
                s.scale(0.8);
                s.height /=2;
                stage.addChildAt(s, 0);

            } else if (name == "heart"){
                var s = new Sprite(images[i], "image", name,
                                    100, 20,
                                    images[i].width, images[i].height
                                  );
                s.scale(0.05);
                stage.addChild(s);

            } else if (name == "red"){
                for(var r=0; r< 15; r++){
                    var randX = Math.round(Math.random() * 5000) + 200;
                    var randY = Math.round(Math.random() * canvas.height - images[i].height - 30) ;
                    var s = new Sprite(images[i], "image", name,
                                        //200-images[i].width, 282,
                                        randX, randY,
                                        images[i].width, images[i].height
                                    );
                    //s.scale(0.05);
                    s.hitMarginX = 0;
                    s.hitMarginY = 0;
                    stage.addChildAt(s, 1);
                    snapSpriteToGrid(s);
                    addToTileGrid(s);
                }
            } else if (name == "green"){
                for(var r=0; r< 15; r++){
                    var randX = Math.round(Math.random() * 5000) + 200;
                    var randY = Math.round(Math.random() * canvas.height - images[i].height - 30) ;
                    var s = new Sprite(images[i], "image", name,
                                        //200, 280,
                                        randX, randY,
                                        images[i].width, images[i].height
                                     );
                    //s.scale(0.05);
                    s.hitMarginX = 0;
                    s.hitMarginY = 0;
                    stage.addChildAt(s, 1);
                    snapSpriteToGrid(s);
                    addToTileGrid(s);
                }

            } else if (name == "blue"){
                for(var r=0; r< 15; r++){
                    var randX = Math.round(Math.random() * 5000) + 200;
                    var randY = Math.round(Math.random() * canvas.height - images[i].height - 30) ;
                    var s = new Sprite(images[i], "image", name,
                                            //250, 170,
                                            randX, randY,
                                            images[i].width, images[i].height
                                    );
                    //s.scale(0.05);
                    s.hitMarginX = 0;
                    s.hitMarginY = 0;
                    stage.addChildAt(s, 1);
                    snapSpriteToGrid(s);
                    addToTileGrid(s);
                }

            }
            else if (name == "sand"){
            //So here we center 2 platforms in current view, each one as wide as the viewport (so they continue off screen to the left and to the right). _[_|_]_
            //these will move one in front of each other (in the moveCamera()), following to the character's moves.
            //It's pretty much a workaround to not having an actual level design. It's a way to keep generating platforms, only with reusing the same 2 platforms.
            //Also note that even though they are made out of many sprites (the same repeated sprite), the collision only tests the bounding box, which is just one wide element.
                floor[0] = new Sprite(images[i], "spriteArray", name,
                    -canvas.width/2, canvas.height - images[i].height,
                    images[i].width, images[i].height,
                    canvas.width/images[i].width
                );
                floor[0].hitMarginX = 0;
                floor[0].hitMarginY = 0;
                stage.addChildAt(floor[0], 3);
                snapSpriteToGrid(floor[0]);
                floor[0].createChildrenRow(floor[0]);
                addToTileGrid(floor[0]);

                //floor[1] = floor[0].clone();
                floor[1] = new Sprite(images[i], "spriteArray", name,
                    floor[0].x+floor[0].width, canvas.height - images[i].height,
                    images[i].width, images[i].height,
                    canvas.width/images[i].width
                );
                floor[0].hitMarginX = 0;
                floor[0].hitMarginY = 0;
                stage.addChildAt(floor[1], 4);
                snapSpriteToGrid(floor[1]);
                floor[1].createChildrenRow(floor[1]);
                addToTileGrid(floor[1]);
                //alert(floor[0].x + " "+floor[0].width+ " ;" + floor[1].children[0].x);
            }
    }



        sun = new Sprite(null, "vector", "sun", canvas.width/2, canvas.height/7);
        //TODO: turn halo off while the player is directly in front fo the sun
        sun.haloOn = true;
        stage.addChildAt(sun, 1);

        camera = new Sprite(null, "camera", "camera", 0, 0, 1, 1);
        stage.addChildAt(camera, 2);


        stage.addChildAt(player, stage.count() - 1);//place teh player under the UI

    }

    snapSpriteToGrid = function (fanta){
        //fanta.x = hitBoxX*16 - fanta.hitMarginX;
        //fanta.y = hitBoxY*16 - fanta.hitMarginY;
        fanta.x = Math.round(fanta.x/16)*16;
        fanta.y = Math.round(fanta.y/16)*16;
    };

    //TODO: These 2 functions should be optimized to only add or remove to grid if the target has moved more than 16px since last reposition. Because sometimes these functions get called every frame (that's the case for the enemy). (the "teleporting" platforms are fine)
    //TODO: Just remembered I'm recalculating the grid of the player's hit box every frame as well. Should change that to what I said ^.
    addToTileGrid = function(s){
        var sToTileCoords;

            sToTileCoords = {
                'x': Math.round((s.x + s.hitMarginX)/16),
                'y': Math.round((s.y + s.hitMarginY)/16),
                'width': Math.round(s.width/16),
                'height': Math.round(s.height/16)
            };

        //console.log("Added: width: " + sToTileCoords.width +"; height: " + sToTileCoords.height + "; name: " + s.name);// +"; "+i + "; " + j);

        var i=sToTileCoords.x; var ci = 0;
        var j=sToTileCoords.y; var cj = 0;
        while(ci < sToTileCoords.width){
            cj=0;
            j=sToTileCoords.y;

            while(cj<sToTileCoords.height){
                //if(typeof tileGrid[i][j] === 'undefined'){ // === means == with no type conversion
                try{
                    tileGrid[i][j] = s;
                }
                catch(e){
                    try{
                        tileGrid[i] = [];//if index was negative, this creates an object that holds an array. Because in Javascript arrays are also objects.
                        tileGrid[i][j] = s;
                        //console.log("Dirty fix in catch: tileGrid["+i+"]["+j+"] = "+ s.name);
                    }
                    catch(e){
                        console.log("Couldn't add a tile to grid at ["+ i +"]["+ j +"]; " + e.message + "; e: " + e + "; s: " + s.name + ";");
                    }
                }


                if(doDebug ){
                //if(s.name=="enemy" ){
                    var d = new Sprite(debug, "image", "debug",
                                    //250, 170,
                                    i*16, j*16,
                                    16, 16
                                );
                    stage.addChildAt(d, stage.count()-1);
                }
                cj++;
                j++;

            }
            ci++;
            i++;
        }

    };



    removeFromTileGrid = function(s){
        var sToTileCoords;

            sToTileCoords = {
                'x': Math.round((s.x + s.hitMarginX)/16),
                'y': Math.round((s.y + s.hitMarginY)/16),
                'width': Math.round(s.width/16),
                'height': Math.round(s.height/16)
            };



        //alert (s.name + "; s.width " + s.width + "; s.width/16 " + sToTileCoords.width);
        var i=sToTileCoords.x; var ci = 0;
        var j=sToTileCoords.y; var cj = 0;
        while(ci < sToTileCoords.width){
            cj=0;
            j=sToTileCoords.y;

            while(cj<sToTileCoords.height){
                //if(typeof tileGrid[i][j] === 'undefined'){
                try{
                    if(tileGrid[i][j].name == s.name){//same class of objects (brick classes are by color)
                        tileGrid[i][j] = 0;
                        //console.log("removed " + s.name + "; from tileGrid["+i+"]["+j+"]");
                    }

                }
                catch(e){
                     console.log("Couldn't remove a tile from grid; " + e.message + "; e: " + e + "; s: " + s.name + ";");

                    }
                cj++;
                j++;
            }
            ci++;
            i++;
        }

    };


    getImageByName = function(name){
        for(var i=0; i<images.length; i++){
            if(images[i].name == name)
                return images[i];
        }
    };

    function getName(url) {
        return url.src.replace( /^.*\/|\.[^.]*$/g, '' )
    }
/*
    function ImageInfo() {
        console.log( getName( document.images[0].src) );
    }
*/

    function readPlayerInput(delta){

        if(playerInput.right == "down" )
        {
            if(player.xVelocity == 0){

                player.xVelocity = 10;
                player.lastHeading = "right";

            }
            else if (player.xVelocity >= maxSpeed){
                player.xVelocity = maxSpeed;
                player.lastHeading = "right";
            }


            player.xAcceleration = accelerate;
        } else if(playerInput.right == "up" ){
            if(player.lastHeading != "left"){
                player.xAcceleration = decelerate;
                //playerInput.right = null;
            }
        }

        if(playerInput.left == "down" )
        {
            if(player.xVelocity == 0){

                player.xVelocity = -10;
                player.lastHeading = "left";

            }
            else if (player.xVelocity <= -maxSpeed){
                player.xVelocity = -maxSpeed;
                player.lastHeading = "left";
            }

            player.xAcceleration = -accelerate;
        } else if(playerInput.left == "up" ){
            if(player.lastHeading != "right"){
                player.xAcceleration = -decelerate;
                //playerInput.left = null;
            }
        }

        //TODO: Jumping inertia speed.
        //Solution1: fall curve simulation: decrease friction only while in the air
        if(player.y != player.prevY && player.xAcceleration && playerInput.left != "down" && playerInput.right != "down" && (player.jumping || player.falling) && !player.hasLanded){
            player.xAcceleration = (player.xAcceleration < 0? -player.fallXAcceleration : player.fallXAcceleration);
            //console.log("slip on; haslanded: " + player.hasLanded);
        }
        //player.stopped = false;
        //console.log(player.yVelocity);
        if(playerInput.up == "down" )
        {
            //jump
            if(player.jumpAllowed && player.hasLanded == true && player.yVelocity <= 50){//player.yVelocity == 0){

                player.yVelocity = yAcceleration;
                //player.yAcceleration = -gravitationalAcceleration;
                player.jumping = true;
                player.hasLanded = false;
                player.jumpY = player.y;
                player.jumpHeightDelimiter = normalJump;
                player.jumpCount ++;
                player.jumpAllowed = false;
                //if(player.jumpCount == 2) alert();
                //console.log("up key down, " + player.y);
            }
            else//2nd Jump (or more)
            if(player.jumping == true && player.jumpAllowed && player.jumpCount < player.jumpCountLimit && player.yVelocity <= 300){
                console.log("doubleJump");
                player.yVelocity = -maxSpeed;
                if(playerInput.left == "down" && player.xVelocity >0){
                    player.xVelocity *= -1;
                } else if(playerInput.right == "down" && player.xVelocity <0){
                    player.xVelocity *= -1;
                }

                //player.jumpY = player.y + player.height/1.2;// the second
                player.jumpY = player.y;
                player.jumpHeightDelimiter = smallJump;
                player.falling = false;
                player.jumpCount ++;
                player.jumpAllowed = false;
            }

            if(player.yVelocity == -10 ){
                //this is a failsafe should the player happen to get stuck in the ground somehow, and can't jump out
                player.y -= 100*delta;//chances increase the lower the framerate
            }

        } else if(playerInput.up == "up" ){
            if(!player.falling){
                player.jumpY = player.y;
                player.falling = true;
                //playerInput.up = null;

            }
            if(player.jumpCount < player.jumpCountLimit)
                player.jumpAllowed = true;
        }


        movePlayerCharacter(delta);

    }


    //var maxXV = 0; var maxYV = 0; var travel = 0;
    function movePlayerCharacter(delta){

        player.prevX = player.x;
        player.prevY = player.y;
        //f = mass * acceleration
        //velocity = speed & direction
        //Euler integration; http://www.emanueleferonato.com/2007/07/21/creation-of-a-ragdoll-with-flash-part-1-verlet-integration/
        player.x = player.x + player.xVelocity * delta;
        var newXVelocity = player.xVelocity + player.xAcceleration * delta;
        if(newXVelocity > maxSpeed)
            player.xVelocity =  maxSpeed;
        else if(newXVelocity < 0 && player.lastHeading == "right" ){
            player.xVelocity = 0;
        }
        else if(newXVelocity < -maxSpeed && player.lastHeading == "left" )
            player.xVelocity = -maxSpeed;
        else if(newXVelocity > 0 && player.lastHeading == "left" ){
            player.xVelocity = 0;
        }
        else if(newXVelocity < 0 && player.lastCollided.left){
            player.xVelocity = 0;
            player.lastCollided.left = false;
        }
        else if(newXVelocity > 0 && player.lastCollided.right){
            player.xVelocity = 0;
            player.lastCollided.right = false;
        }
        else
            player.xVelocity = newXVelocity;

        //player.y = player.y + player.yVelocity * delta;
        //player.yVelocity = player.yVelocity + player.acceleration * delta;

      var newY = player.y + player.yVelocity * delta;


        if(player.jumpY && player.y > 0 && player.jumpY - newY > player.jumpHeightDelimiter){
            player.falling = true;
            player.y = player.jumpY - player.jumpHeightDelimiter;
            player.jumpY = null;
        } else if (player.jumpY && player.y < 0 && Math.abs(newY) + player.jumpY > player.jumpHeightDelimiter){
            player.falling = true;
            player.y = player.jumpY - player.jumpHeightDelimiter;
            player.jumpY = null;
        } else{
            player.y = newY;
        }


        groundPlayer();


        var newYVelocity;
        /*
        if(player.falling){//player.falling){
            newYVelocity = player.yVelocity + player.yAcceleration * delta;
            //console.log(delta + "; player is falling; velocity: " + newYVelocity + "; yVelo: "+ player.yVelocity +"; acc: " + player.yAcceleration);

        } else {
            newYVelocity = player.yVelocity - player.yAcceleration * delta;
        }
        */
        //console.log(delta); 0.015-0.017
        newYVelocity = player.yVelocity + player.yAcceleration * delta;


        if(!player.falling && player.jumping){
            player.yVelocity = -jumpSpeed;
        }else if(newYVelocity < -5*maxSpeed){
            player.yVelocity = -5*maxSpeed;
        } else {
            player.yVelocity = newYVelocity;
        }


        if(player.y > canvas.height + 200){
            //console.log("YOU FELL OUT YOU TWIT");
            player.x -= 200;
            player.y = canvas.height - player.height -30;
            player.xVelocity = 0;
            player.yVelocity = 0;
        }

        //if(maxXV< Math.abs(player.xVelocity * delta)) maxXV = Math.abs(player.xVelocity * delta);
        //if(maxYV< Math.abs(player.yVelocity * delta)) maxYV = Math.abs(player.yVelocity * delta);
        //if(player.x > 2500) alert ("max xv: " + maxXV + "; max yv: " + maxYV);
        //x 6-8 pps
        //y 11-12.9 pps (falling from max double jump height)
        //console.log(player.x);
        //width = 5677px;
        //integrate(delta); //RK4
    }


    function groundPlayer(){
        //if(player.falling && player.hasLanded){
        if( player.hasLanded ){
            //console.log("player grounded");


            if(player.falling)
                player.falling = false;
            //player.hasLanded = false;
            player.jumping = false;
            player.jumpCount = 0;
            if(playerInput.up == "down" )
                player.jumpAllowed = false;
            //this restores the friction from air back to ground friction
            if(player.xAcceleration == -player.fallXAcceleration){
                player.xAcceleration = -accelerate;
                //console.log("friction restored");
            } else if(player.xAcceleration == player.fallXAcceleration){
                player.xAcceleration = accelerate;
                //console.log("friction restored");
            }
        //} else if (player.jumping){
        } else if (!player.hasLanded){
            player.yAcceleration = gravitationalAcceleration;
        }

    }



    function stopXAcceleration(){
        player.xAcceleration = 0;
        player.xVelocity = 0;
    }

    function stopYAcceleration(){
        //player.yAcceleration *= -1;
        player.yAcceleration = Math.abs(player.yAcceleration);
        player.yVelocity = -yAcceleration;//Math.abs(player.yVelocity);//0;
        player.jumping = false;
        player.falling = true;
        player.jumpAllowed = false;
    }



    var dirtyEnemyDirection = 1;
    function moveAI(delta, tick){


        /*
        if(tick.toFixed(2) == Math.round(tick).toFixed(2)){
            //sun.x += 1;
            sun.y += 1;
        }
        */
        if(enemy.x <= 200 || enemy.x>= 5000){
            dirtyEnemyDirection *= -1;
            console.log("changed direction");

        }

        if(delta < 5){
            removeFromTileGrid(enemy);
            enemy.x += 50 * delta *dirtyEnemyDirection;
            addToTileGrid(enemy);
        }



        //enemy.x = enemy.x + (delta * direction) / 100000;
    }

    function runPhysics(delta){
        /*
         Here starts the collision detection for the player. The concepts are simple, but I did
         get inspired from the following posts:
         1. http://higherorderfun.com/blog/2012/05/20/the-guide-to-implementing-2d-platformers/
         Particularly Type#2: Tile Based (Smooth)

         2. http://stackoverflow.com/questions/6673822/collision-reaction-in-a-2d-side-scroller-game-similar-to-mario/6699728#6699728
         The question and first answer in this SO post.
         */
        //handleCollision(getClosestObjects(gridCheck()));
        handleCollision(gridCheck());


        //TODO: If the player or a brick is in front of the sun, the sun's halos should fade out. :D

        if(player.x < -player.hitMarginX){
            player.x = -player.hitMarginX;
            stopXAcceleration();
        }
        if(player.x> 5445-player.width){
            player.x = 5445-player.width;
            stopXAcceleration();
        }

    }


    //TODO: change all (or most) ==s with ===s, for performance.
    function gridCheck(){
        //var pToTileX_prev = Math.round((player.prevX + player.hitMarginX)/16);
        //var pToTileY_prev = Math.round((player.prevY + player.hitMarginY)/16);

        var pToTileX, pToTileY;

        pToTileX = Math.round((player.x + player.hitMarginX)/16);

        pToTileY = Math.round((player.y + player.hitMarginY)/16);

        var found = [];


        //first thing we do, is we check if any box in the player's tile grid has hit anything
        //if so, we save which thing(s) the player hit.
        //after that, we will go through all found[s],
        //then see which side of the player they are on, and then change player's position accordingly.
        for(var i=pToTileX; i<pToTileX + Math.round(player.width/16); i++){//console.log("i: " + i + "; i< " + test + "; i++ ");
            for(var j=pToTileY; j<pToTileY + Math.round(player.height/16); j++){//console.log("j: " + j + "; j< " + test + "; j++ ");
                if(doDebug){
                    var d = new Sprite(debug, "image", "debug",
                        //250, 170,
                        i*16, j*16,
                        16, 16
                    );
                    stage.addChildAt(d, stage.count()-1);
                }

                try{
                    if(tileGrid[i][j]){// && !separatedAxis(tileGrid[i][j])){
                        if(found[0]){

                            for(var it=0; it< found.length; it++){//alert(it + "; length: " + found.length);
                                if(it == found.length || found.length==0){
                                    found.push(tileGrid[i][j]);
                                }
                                else if(found[it] == tileGrid[i][j]){
                                    break; //if current tile contains an object we've already found in another tile, we move on. no need to save it twice
                                }
                            }

                        }
                        else found.push(tileGrid[i][j]);

                    }
                }catch(e){
                    //console.log("cough... " + e.message);
                }


            }
        }
        return found;
    }

    function separatedAxis(sprite){
        //we check if there is any space between the player and this sprite, either horizontally or vertically. (or both)
        var horiz, vert = true;
        if(sprite.x + sprite.width <= player.x){//sprite left of player
            horiz = false;
        } else
        if(sprite.x >= player.x + player.width){//sprite right of player
            horiz = false;
        }

        if(sprite.y + sprite.height <= player.y){//above
            vert = false;
        }else
        if(sprite.y >= player.y + player.height){//below
            vert = false;
        }

        if(!horiz || !vert){
            return false;
        }
        else return true;
    }

    //actually there's no need for this function (not using it any more). (it may even be troublesome if two/more tiles are partly overlapping)
    function getClosestObjects(found){
        if(found.length >0){
            //loop through all objects we've collided with, and determine which is/are closest. (it's possible that multiple objects are at the same distance to the player)
            //we will check the distance using Pythagora's theorem. The distance will be from the player's centre to the object's centre.
            var player_centre = {//player's hit box isn't centred, so we calculate it slightly differently
                                'x':player.x + player.displayObject.data.width/2,
                                'y':player.y + player.displayObject.data.height/2
                                };
            var target_centre;
            var third_point;
            var pythagora_distance;
            var closest = [];
            var minDistance = 1000;

            for(var i=0; i<found.length; i++){
                target_centre = getCentreOfSprite(found[i]);
                third_point = getThirdPoint(player_centre, target_centre);
                pythagora_distance = getHypotenuse(player_centre, target_centre, third_point);

                //console.log("pyt distance: " + pythagora_distance + "; min distance: " + minDistance);
                if(pythagora_distance < minDistance){
                    minDistance = pythagora_distance;
                    closest = []; //we erase all previous records, since we found a better (closer) candidate
                    closest.push(found[i]);
                } else
                if(pythagora_distance == minDistance){
                    closest.push(found[i]);
                }
            }
            return closest;
        }
        else return false;
    }

    /*
    This is a rather clever concept from the aforementioned SO post:
    "Determine how far on the X and Y axes the player is overlapping the non-passable tile
    Resolve collision by moving the player out of that tile only on the shallow axis (whichever axis is least penetrated)"
     (while iterating through all relevant objects the player collided with)
     */
    function handleCollision(collidedObjects){
        //if(closest!=false){
        if(collidedObjects.length>0){
            //var pToTileX = Math.round((player.x + player.hitMarginX)/16);
            //var pToTileY = Math.round((player.y + player.hitMarginY)/16);

            //for(var i=pToTileX; i<pToTileX + Math.round(player.width/16); i++){
            for(var i=0; i<collidedObjects.length; i++){
                //if(!separatedAxis(collidedObjects[i])){

                var howFarInX, howFarInY;
                //var dx = player.x+player.hitMarginX - collidedObjects[i].x;
                //var dy = player.y+player.hitMarginY - collidedObjects[i].y;
                var dx = (player.x + player.hitMarginX) - (collidedObjects[i].x + collidedObjects[i].hitMarginX);
                var dy = (player.y + player.hitMarginY) - (collidedObjects[i].y + collidedObjects[i].hitMarginY);

                var playerIsAbove, playerIsBelow;
                var playerIsLeft, playerIsRight;

                if(dx <= 0){//player should be left of object
                    howFarInX = player.width + dx; //-abs(d)
                    playerIsLeft = howFarInX;
                } else if(dx > 0){//player should be right of object
                    howFarInX = collidedObjects[i].width - dx;
                    playerIsRight = howFarInX;
                }

                if(dy <= 0){//player should be above object (coordinates start top left of everything)
                    howFarInY = player.height + dy; //-abs(d)
                    playerIsAbove = howFarInY;

                    //player.hasLanded = true;
                    //player.jumpAllowed = true;
                    //player.falling = false;

                    //console.log("player should be above object; HasLanded = true");
                } else if(dy > 0){//player should be below object
                    howFarInY = collidedObjects[i].height - dy;
                    playerIsBelow = howFarInY;
                }


                if(howFarInX <= howFarInY  && howFarInX >0){
                //if(howFarInX >0){

                    if(playerIsLeft == howFarInX){//console.log("player is left of object");
                        if(player.xVelocity > 0)
                            stopXAcceleration();
                        player.lastCollided.right = true;
                        //console.log("[l of] moved player from [" + player.x + "]["+ player.y + "] to [" );
                        if(player.x - howFarInX > player.prevX)
                            player.x -= (howFarInX) -0.2;// - (player.width));
                        else
                            player.x -= player.prevX-player.x -0.2;
                        //player.stopped = true;

                        //console.log( player.x + "][" + player.y + "], because it was " + howFarInX + " far inside an obstacle");
                        if(collidedObjects[i].name == "enemy"){
                            player.hit = true;
                            //player.x -= 5;
                            //player.xVelocity = -1500;
                            player.yVelocity = -200;
                            player.xVelocity = -90;
                        } else
                        player.xVelocity = -50;
                    }
                    else if(playerIsRight == howFarInX){//console.log("player is right of object");
                        if(player.xVelocity < 0)
                            stopXAcceleration();
                        player.lastCollided.left = true;
                        //console.log("[r of] moved player from [" + player.x + "]["+ player.y + "] to [" );
                        //console.log("player.x was: " + player.x);
                        if(player.x + howFarInX < player.prevX)
                            player.x += howFarInX +0.2;
                        else
                            player.x += player.x-player.prevX +0.2;

                        if(collidedObjects[i].name == "enemy"){
                            player.hit = true;
                            //player.xVelocity = 1500;
                            player.yVelocity = -200;
                            player.xVelocity = 90;
                            player.x += 2;
                        } else
                        player.xVelocity = 50;
                    }
                }

                else
                if(howFarInY >0){
                    if(playerIsAbove == howFarInY){
                        //console.log("[player is above object] moved player from [" + player.x + "]["+ player.y + "] to [" );
                        if(player.y - howFarInY > player.prevY)
                            player.y -= howFarInY;
                        else player.y = player.prevY ;

                        player.hasLanded = true;
                        //player.jumpAllowed = true;
                        player.jumping = false;
                        player.yVelocity = 0;//0;
                        //console.log(delta); 15-17 so 40

                        if(collidedObjects[i].name == "enemy"){
                            collidedObjects[i].hit = true;
                            player.yVelocity = -200;

                            dirtyEnemyDirection *=-1;//Now if you bounce on the enemy once, it changes direction.
                        }

                    }
                    else if(playerIsBelow == howFarInY ){
                        //console.log("[player is below object] moved player from [" + player.x + "]["+ player.y + "] to [" );
                        stopYAcceleration();

                        if(collidedObjects[i].name == "enemy"){
                            player.hit = true;


                        }else
                        if( collidedObjects[i].name == "red" || collidedObjects[i].name == "green" || collidedObjects[i].name == "blue"){
                            //player.hitEnemy = collidedObjects[i];
                            collidedObjects[i].hit = true;

                            /*
                            if(collidedObjects[i].width * 0.8 >= 16){
                                removeFromTileGrid(collidedObjects[i]);
                                collidedObjects[i].scale(0.8);
                                //collidedObjects[i].width *= 0.8;
                                //collidedObjects[i].height *= 0.8;
                                //scale(collidedObjects[i], 0.8);
                                addToTileGrid(collidedObjects[i]);

                            }
                            */
                            player.yVelocity = 50;
                        }
                    }
                }


                //TODO:
                //Fixed: hitting an enemy from the left, and persisting on going right allows you to very slowly move through the enemy. (This should be fixed by either pushing back the player and playing a player.hit animation, either disable clipping and blink the player texture)
                //Fixed (I think): there's a chance that if a brick is at ~98% of player's height, and you try to move through it, you sink into the ground. (I think this problem is usually avoided in sidescrollers, through the design of the map)


                //TODO: To fix:
                //If I have time, I should finish the code for the camera to allow for small player adjustments.
                //Sometimes, and only if player is moving left to right, (perhaps after a collision with a weirdly placed random block), if the player hits another block to the right, the player's hitbox will enter 1 tile deep inside that object for some reason (and remain like that until you move left or jump). Need to look into this.

            }
            //}
        }
    }
/*
    function scale (obj, multiplier){

        var imgW = obj.width;
        var imgH = obj.height;
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

        obj.width = imgW;
        obj.height = imgH;

    }
*/
    function getHypotenuse(player, target, third){
        var cp = Math.abs(player.x - third.x);
        var ct = Math.abs(target.y - third.y);
        //var hypotenuse =
        return Math.sqrt(cp*cp + ct*ct);
    }

    function getThirdPoint(centrePlayer, centreSprite){
        return {
                    'x': centrePlayer.x,
                    'y': centreSprite.y
                };
    }

    function getCentreOfSprite(fanta){
        return {
                'x': fanta.x + fanta.width/2,
                'y': fanta.y + fanta.height/2
                };
    }



    var flag = true;
    var camera_px = 0;
    var camera_distance = 50;
    function moveCamera(delta){
        if(player.x>=canvas.width/2){
            camera.x = player.x - canvas.width/2;

            //Here I tried to afford for small adjustments. It was late at night and it only partially works
            /*
            var acc = Math.abs(player.xAcceleration);
            if(player.xVelocity == 0 && flag){
                //console.log("player.stopped");
                camera_px = player.x;
            }
            else if(player.x > camera_px + camera_distance){
                var test = camera.x + acc * delta;
                if(camera.x < player.x - canvas.width/2 && test <= player.x){

                    camera.x = test;
                    flag = true;

                } else{
                    camera.x = player.x - canvas.width/2;
                    flag = false;
                }
            }
            else if(player.x < camera_px - camera_distance){
                var test2 = camera.x - acc * delta;
                if(camera.x > player.x - canvas.width/2 && test2 >= player.x){

                    camera.x = test2;
                    flag = true;

                } else{
                    camera.x = player.x - canvas.width/2;
                    flag = false;
                }
            }


            */
        } else camera.x = 0;

        if(player.y<=canvas.height/3){
            camera.y = canvas.height/3 - player.y;
        } else camera.y = 0;


        liveWorldGeneration();
    }

    function liveWorldGeneration(){
        //generate new ground by swapping existing floor sprite arrays, also making a random gap. Reposition blocks.
        // for demo purposes, and to keep from drawing more than one-screen-width worth of ground at a time.
        var leftmost, rightmost;
        if(floor[0].x <= floor[1].x){
            leftmost = 0; rightmost = 1;}
        else if(floor[0].x > floor[1].x){
            leftmost = 1; rightmost = 0;}



        if(camera.x !=0 && floor[leftmost].x - camera.x > 0 ){

            //adding a random length hole for funzies:
            var randomHole = Math.round(Math.random() * 450) + 100;
            removeFromTileGrid(floor[rightmost]);
            floor[rightmost].moveTo(floor[rightmost], floor[leftmost].x - floor[rightmost].width  - randomHole);
            addToTileGrid(floor[rightmost]);
            //alert("moving floor[l " + leftmost + "; " );
        } else if(player.x !=0 && floor[rightmost].x + floor[rightmost].width - camera.x < canvas.width ){

            var randomHole = Math.round(Math.random() * 450) + 100;
            if(floor[rightmost].x + floor[rightmost].width   + randomHole < 5808){
                removeFromTileGrid(floor[leftmost]);
                floor[leftmost].moveTo(floor[leftmost], floor[rightmost].x + floor[rightmost].width   + randomHole);
                addToTileGrid(floor[leftmost]);
            }
            //alert("moving floor[r " + rightmost);
        }
    }

    function gameLoop(){// TODO: How do you do sprite animation? L4 SpriteSheet library.
		
        current = Date.now();
        delta = current - previous;
        previous = current;

        //This is a dirty physics tick fix for extremely slow systems (<10fps) (like my phone), otherwise the character would fall through the ground. The tradeoff is old school game slowmo.
        delta = (delta > 100 ? 100 : delta );//0.100

        if(!isPaused){
            tick+= 0.01;// * delta/1000;
            tick > 9000000000000000 ? tick = 0 : 0;


            readPlayerInput(delta/1000);//read controls and move player character
            moveAI(delta/1000, tick);//enemy paths
            runPhysics(delta/1000);
            moveCamera(delta/1000);//not really a camera. just pan foreground and bg, dispose of items off screen.

            /*

             */


            window.requestAnimationFrame(gameLoop);
            //window.requestAnimationFrame(gameLoop, contextGL.canvas);
            stage.render(delta, stage, playerInput);
        } else {
            playerInput.left = null;
            playerInput.right = null;
            playerInput.up = null;
            //TODO: (fixed; I think) figure out elusive game-resume spontaneous movement error. (possibly due to browser handling of key events and window focus)
            //player.lastHeading = null;
            window.requestAnimationFrame(gameLoop);

            //TODO: make a fps counter (make a browser animation frame based one) and total Sprite Count
        }
		
		if(frameCount==0){
			pause();
		}
		frameCount+=1;
    }

/*
    //advance the physics state ahead from t to t+dt using one set of derivatives,
    //then once there, recalculate the derivatives using this new state.
    function evaluate(delta, derivative){
        //We take the current position and velocity and advance it by delta seconds
        //using an Euler Integration step with the velocity and acceleration (the derivatives)
        var new_p_x = player.x + derivative.x * delta; //derivative.x = velocity
        var new_p_v = player.velocity + derivative.velocity * delta; //derivative.velocity = acceleration

        //Calculate new derivatives at this point in time using the integrated state
        //var new_derivative =
        return {//derivative of position = velocity
                'x': new_p_x, //derivative of Velocity = acceleration
                'velocity': acceleration(new_p_x, new_p_v)
            };

        //return new_derivative;
    }

    function acceleration(new_p_x, new_p_v){
        var k = 10; //spring
        var b = 1; //damper

        return -k * new_p_x - b * new_p_v;
    }


     //Equations of Motion from the following link:
     //http://gafferongames.com/game-physics/integration-basics/
     //Tried the Runge Kutta order 4 integrator aka RK4 (considered best)
    function integrate(delta){
        var d1 = evaluate(0.0, derivative);
        var d2 = evaluate(delta * 0.5, d1);
        var d3 = evaluate(delta * 0.5, d2);
        var d4 = evaluate(delta * 0.5, d3);

        var dX_delta = 1.0/6.0 * (d1.x + 2.0 * (d2.x + d3.x) + d4.x);
        var dV_delta = 1.0/6.0 * (d1.velocity + 2.0 * (d2.velocity + d3.velocity) + d4.velocity);

        player.x += dX_delta * delta;
        player.velocity += dV_delta * delta;
    }
*/
/*
    Object.prototype.clone = function() {
        var newObj = (this instanceof Array) ? [] : {};
        for (i in this) {
            if (i == 'clone') continue;
            if (this[i] && typeof this[i] == "object") {
                newObj[i] = this[i].clone();
            } else newObj[i] = this[i]
        } return newObj;
    };
 */
};

