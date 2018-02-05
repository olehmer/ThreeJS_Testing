//set the scene size
var WIDTH = 400;//window.innerWidth;
var HEIGHT = 400;//window.innerHeight;

//set the camera attributes
var VIEW_ANGLE = 45;
var ASPECT = WIDTH/HEIGHT;
var NEAR = 0.1;
var FAR = 10000;

//get the HTML container
var container = document.querySelector('#container');

//create the renderer, camera, and add them to the scene
var renderer = new THREE.WebGLRenderer();
var camera = new THREE.PerspectiveCamera(
    VIEW_ANGLE,
    ASPECT,
    NEAR,
    FAR
);
camera.position.z = 1; //orbit controls breaks if camera is at 0,0,0
camera.position.x = 0;
camera.position.y = 0;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x331133);
scene.add(camera);
renderer.setSize(WIDTH, HEIGHT);

container.appendChild(renderer.domElement);

//add camera controls
var controls = new THREE.OrbitControls( camera , renderer.domElement);
//controls.enableZoom = true;
//controls.autoRotate = true;

//Create the background star texture
var bg_texture = new THREE.TextureLoader().load("background.png");
var bg_geometry = new THREE.SphereGeometry(1000,100,100);
var bg_material = new THREE.MeshBasicMaterial({map: bg_texture});
var bg_sphere = new THREE.Mesh(bg_geometry, bg_material);
bg_sphere.scale.x = -1; //invert the texture to the inside, where we are
scene.add(bg_sphere);

//create the star billboard
var texture = new THREE.TextureLoader().load("star_glow.png");
var geometry = new THREE.PlaneBufferGeometry( 340, 340, 32 );
var material = new THREE.MeshBasicMaterial( {map: texture} );
material.transparent = true;
material.blending = THREE.AdditiveBlending;
var plane = new THREE.Mesh( geometry, material );
plane.quaternion.copy( camera.quaternion ); //always face the camera
plane.position.z = -500;
plane.renderOrder = Infinity; //render on top of everything

var star_sphere_mat = new THREE.MeshBasicMaterial({color:0xffffff});
var star_sphere_geo = new THREE.SphereGeometry(5,50,50);
var star_sphere = new THREE.Mesh(star_sphere_geo, star_sphere_mat);
star_sphere.position.copy(plane.position); 
scene.add(star_sphere);
plane.onBeforeRender = function(renderer){
    //the line below will render the star glow behind the planet until occulted
    renderer.clearDepth();
    plane.quaternion.copy( camera.quaternion ); //always face the camera
};
scene.add( plane );

function castRay(objs){
    var dest = star_sphere.position.clone();
    var origin = camera.position.clone();
    var direction = new THREE.Vector3();
    direction.subVectors(dest, origin).normalize();

    var ray = new THREE.Raycaster(origin, direction);
    scene.updateMatrixWorld(); //required since we haven't rendered yet

    var intersects = ray.intersectObjects(objs);
    if (intersects[0]){
        //console.log(intersects.length);
        if (intersects.length ==1){
            //star isn't blocked
            plane.visible = true;
        }
        else{
            //something is in the way
            plane.visible = false;
        }
    }
}


//create the star light
var star_light = new THREE.PointLight(0xffffff, 1, 10000000);
star_light.position.set(0,0,-500); 
scene.add(star_light);


var planet_geometry = new THREE.SphereGeometry(50,20,20);
var planet_material = new THREE.MeshLambertMaterial( {color:0xff0f99});
var planet = new THREE.Mesh(planet_geometry, planet_material);
planet.position.x = 125;
planet.position.z = -350;
scene.add(planet);

//for the orbit controls, point at the planet
controls.target.copy(planet.position);

function update(){
    castRay([star_sphere, planet]);
    renderer.render(scene,camera);

    controls.update();
    requestAnimationFrame(update);
}


requestAnimationFrame(update);

document.addEventListener("keydown", onDocumentKeyDown, false);
function onDocumentKeyDown(event) {
    var moveAmt = 0.003;
    var keyCode = event.which;
    if (keyCode == 37) {
        //left arrow
        camera.position.x -= moveAmt;
    } else if (keyCode == 38) {
        //up arrow
        camera.position.y += moveAmt;
    } else if (keyCode == 39) {
        //right arrow
        camera.position.x += moveAmt;
    } else if (keyCode == 40) {
        //down arrow
        camera.position.y -= moveAmt;
    }
    camera.lookAt((15,0,-50));
}

