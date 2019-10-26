//set the scene size
var WIDTH = 16*100; //window.innerWidth;
var HEIGHT = 9*100; //window.innerHeight;

let AU = 1.496*Math.pow(10,8); //1 AU in km
let SUN_LUM = 3.828*Math.pow(10,26);
var old_temp = 5777; //sun surface temp initially
var orbital_dist_old = 1*AU; //initial orbital distance

//set the camera attributes
var VIEW_ANGLE = 45;
var ASPECT = WIDTH/HEIGHT;
var NEAR = 100;
var FAR = 50*AU;

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

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.add(camera);
renderer.setSize(WIDTH, HEIGHT);

//set realistic lighting
renderer.physicallyCorrectLights = true;
//renderer.gammaOutput = true;
//renderer.gammaFactor = 2.2;

container.appendChild(renderer.domElement);

//add camera controls
var controls = new THREE.OrbitControls( camera , renderer.domElement);
//controls.enableZoom = true;
//controls.autoRotate = true;


//Create the background star texture
var bg_texture = new THREE.TextureLoader().load("../star/background.png");
var bg_geometry = new THREE.SphereGeometry(10*AU,100,100);
var bg_material = new THREE.MeshBasicMaterial({map: bg_texture});
var bg_sphere = new THREE.Mesh(bg_geometry, bg_material);
bg_sphere.material.side = THREE.BackSide; //invert the texture
bg_sphere.position.set(0,0,0);
scene.add(bg_sphere);

//create the star light
let STAR_LIGHT_BASE = 3;
var star_light = new THREE.PointLight(0xffffff, STAR_LIGHT_BASE, 0, 2);
star_light.position.set(0,0,0); 
scene.add(star_light);

var ambient = new THREE.AmbientLight(0x444444);
scene.add(ambient);

var star_pos = new THREE.Vector3(0,0,0);
var scale = 1.0;
var bg_star = new DistantStar(old_temp, star_pos, scale, camera, scene);
scene.add(bg_star.getStarToRender());


var planet_geometry = new THREE.SphereGeometry(6400.0,50,50);
var planet_texture = new THREE.TextureLoader().load("../star/earth.jpg");
var planet_material = new THREE.MeshLambertMaterial({map: planet_texture});
//var planet_material = new THREE.MeshLambertMaterial( {color:0x331fff});
var planet = new THREE.Mesh(planet_geometry, planet_material);
planet.position.x = 1*AU;
planet.position.z = 0;
scene.add(planet);

//for the orbit controls, point at the planet
controls.target.copy(planet.position);
camera.position.x = planet.position.x + 50000.0;
camera.position.z = 7000;
camera.position.y = 5500;



var new_temp = 5777;
var should_start = false;
var all_done = false;
var capturer = new CCapture({format: 'png'});

function update(){
    controls.autoRotate = false;

    planet.position.x = 1*AU;

    //the light should fall with distance but it doesn't, do it here
    let factor = Math.pow(bg_star.getLuminosity(), 1.0)/Math.pow(orbital_dist_old, 2);
    star_light.intensity = STAR_LIGHT_BASE*factor;

    //move the camera
    //controls.target.copy(planet.position);
//    camera.position.x = AU + 70000;
//    camera.position.z = 15000;
//    camera.position.y = 5500;
    
    if( new_temp > 2709 && should_start){
        bg_star.setStarTemperature(new_temp);
        renderer.render(scene,camera);
        new_temp -= 10;
    }
    else if (new_temp <= 2709 && should_start && !all_done){
        capturer.stop();
        capturer.save();
        all_done = true;
    }
    star_light.intensity = STAR_LIGHT_BASE*factor;
    
    bg_star.updateStar([planet]);
    renderer.render(scene,camera);

    controls.update();
    capturer.capture(renderer.domElement);
    requestAnimationFrame(update);
}

document.addEventListener('keyup', function (event) {
    //start when a button is pressed
    capturer.start();
    should_start = true;
    console.log("starting");
});

requestAnimationFrame(update);


