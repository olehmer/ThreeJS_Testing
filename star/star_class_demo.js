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
scene.background = new THREE.Color(0x000000);
scene.add(camera);
renderer.setSize(WIDTH, HEIGHT);

container.appendChild(renderer.domElement);

//add camera controls
var controls = new THREE.OrbitControls( camera , renderer.domElement);
//controls.enableZoom = true;
//controls.autoRotate = true;

//create the star light
var star_light = new THREE.PointLight(0xffffff, 1, 10000000);
star_light.position.set(0,0,-500); 
scene.add(star_light);

var star_pos = new THREE.Vector3(0,0,-500);
var scale = 0.000007187/2.0; //scale the sun radius to 5
var bg_star = new DistantStar(5788, star_pos, scale, camera, scene);
scene.add(bg_star.getStarToRender());


var planet_geometry = new THREE.SphereGeometry(50,20,20);
var planet_material = new THREE.MeshLambertMaterial( {color:0xff0f99});
var planet = new THREE.Mesh(planet_geometry, planet_material);
planet.position.x = 125;
planet.position.z = -350;
scene.add(planet);

//for the orbit controls, point at the planet
controls.target.copy(planet.position);


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


