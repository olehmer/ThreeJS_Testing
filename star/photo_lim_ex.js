//set the scene size
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var AU = 1.496*Math.pow(10,8); //1 AU in km

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
camera.position.z = 0; //orbit controls breaks if camera is at 0,0,0
camera.position.x = 0.3*AU;
camera.position.y = 0;

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.add(camera);
renderer.setSize(WIDTH, HEIGHT);

container.appendChild(renderer.domElement);

//add camera controls
var controls = new THREE.OrbitControls( camera , renderer.domElement);
//controls.enableZoom = true;
//controls.autoRotate = true;


//Create the background star texture
var bg_texture = new THREE.TextureLoader().load("background.png");
var bg_geometry = new THREE.SphereGeometry(10*AU,100,100);
var bg_material = new THREE.MeshBasicMaterial({map: bg_texture});
var bg_sphere = new THREE.Mesh(bg_geometry, bg_material);
bg_sphere.material.side = THREE.BackSide; //invert the texture
bg_sphere.position.set(0,0,0);
scene.add(bg_sphere);

//create the star light
var star_light = new THREE.PointLight(0xffffff, 5, AU);
star_light.position.set(0,0,0); 
scene.add(star_light);

var ambient = new THREE.AmbientLight(0x444444);
scene.add(ambient);

var star_pos = new THREE.Vector3(0,0,0);
var scale = 1.0;
var bg_star = new DistantStar(3288, star_pos, scale, camera, scene);
scene.add(bg_star.getStarToRender());


var planet_geometry = new THREE.SphereGeometry(6400.0,50,50);
var planet_texture = new THREE.TextureLoader().load("earth.jpg");
var planet_material = new THREE.MeshLambertMaterial({map: planet_texture});
//var planet_material = new THREE.MeshLambertMaterial( {color:0x331fff});
var planet = new THREE.Mesh(planet_geometry, planet_material);
planet.position.x = 0.29*AU;
planet.position.z = 0;
scene.add(planet);

//for the orbit controls, point at the planet
controls.target.copy(planet.position);
camera.position.x = planet.position.x +70000.0;
camera.position.z = 17000;
camera.position.y = 8000;


//Create the background star texture
//var bg_texture = new THREE.TextureLoader().load("background.png");
//var bg_geometry = new THREE.SphereGeometry(1000,100,100);
//var bg_material = new THREE.MeshBasicMaterial({map: bg_texture});
//var bg_sphere = new THREE.Mesh(bg_geometry, bg_material);
//bg_sphere.scale.x = -1; //invert the texture to the inside, where we are
//scene.add(bg_sphere);


function update(){
    bg_star.updateStar([planet]);
    renderer.render(scene,camera);

    controls.update();
    requestAnimationFrame(update);
}


requestAnimationFrame(update);


