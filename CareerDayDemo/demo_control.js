//set the scene size
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

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
//renderer.physicallyCorrectLights = true;
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
camera.position.x = planet.position.x +70000.0;
camera.position.z = 15000;
camera.position.y = 5500;


//set up the controls    
var demo_controls = function() {
  this.temp = old_temp;
  this.orb_dist = 1;
  this.rotate = true;
};

var text = new demo_controls();
window.onload = function() {
  var gui = new dat.GUI();
  gui.add(text, 'temp', 2700, 10000).name("Star Temp.");
  gui.add(text, 'orb_dist', 0.1, 2).name("Orbital Dist.");
  gui.add(text, 'rotate').name("Rotate");
};


function update(){
    if (text.rotate){
        controls.autoRotate = true;
    }
    else {
        controls.autoRotate = false;
    }

    if ( orbital_dist_old != text.orb_dist ){
        planet.position.x = text.orb_dist*AU;
        orbital_dist_old = text.orb_dist;


        //the light should fall with distance but it doesn't, do it here
        let factor = Math.pow(bg_star.getLuminosity(), 1.0)/Math.pow(orbital_dist_old, 2);
        star_light.intensity = STAR_LIGHT_BASE*factor;

        //move the camera
        controls.target.copy(planet.position);
        camera.position.x = orbital_dist_old*AU +70000.0;
        camera.position.z = 15000;
        camera.position.y = 5500;
    }
    if( text.temp != old_temp ){
        old_temp = text.temp;
        bg_star.setStarTemperature(text.temp);

        let factor = Math.pow(bg_star.getLuminosity(), 1.0)/Math.pow(orbital_dist_old, 2);
        star_light.intensity = STAR_LIGHT_BASE*factor;
        console.log(star_light.intensity);
    }
    bg_star.updateStar([planet]);
    renderer.render(scene,camera);

    controls.update();
    requestAnimationFrame(update);
}


requestAnimationFrame(update);


