var vShader = 
    "varying vec3 vNormal;\n"+
    "attribute float displacement;\n"+
    "uniform float amplitude;\n"+
	"void main()	{\n"+
        "vNormal = normal;\n"+
        "vec3 newPosition = position + normal*vec3(displacement*amplitude);\n"+
		"gl_Position = projectionMatrix*\n"+
                      "modelViewMatrix*\n"+
                      "vec4( newPosition, 1.0 );\n"+
	"}\n"
;

var fShader = 
    "varying vec3 vNormal;\n"+
	"void main()	{\n"+
        "vec3 light = vec3(0.5,0.2,1.0);\n"+
        "light = normalize(light);\n"+
        "float dProd = max(0.0, dot(vNormal, light));\n"+
		"gl_FragColor = vec4(dProd, 0.0, dProd, 1.0);\n"+
	"}\n"
;


//set the scene size
var WIDTH = 400;
var HEIGHT = 400;

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

var scene = new THREE.Scene();
scene.add(camera);
renderer.setSize(WIDTH, HEIGHT);

container.appendChild(renderer.domElement);

var RADIUS = 50;
var SEGMENTS = 16;
var RINGS = 16;

//var sphereMaterial = new THREE.MeshLambertMaterial(
//    {
//        color:0xCC0000
//    }
//);

var uniforms = {
    amplitude: {
        type: "f",
        value: 0
    }
};

var shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms: uniforms
});



//create a new mesh which shpere geometry
var sphere = new THREE.Mesh(
    new THREE.SphereBufferGeometry(
        RADIUS,
        SEGMENTS,
        RINGS),
    shaderMaterial);


//add the random values to the displacement attribute
var verts = sphere.geometry.getAttribute("position");
var randData = new Float32Array(verts.count);
for (var i=0; i<verts.count; i++){
    randData[i]=(Math.random()*30.0);
}

//create the random array attributes for the geomentry
var attrbts = new THREE.BufferAttribute(randData,1);

sphere.geometry.addAttribute("displacement", attrbts);


sphere.position.z = -300;
scene.add(sphere);

//var pointLight = new THREE.PointLight(0xFFFFFF);
//pointLight.position.x = 10;
//pointLight.position.y = 50;
//pointLight.position.z = 130;
//
//scene.add(pointLight);


var delta = 0.1;
function update(){
    delta += 0.1;
    sphere.position.x = Math.sin(delta)*10;
    sphere.position.y = Math.sin(delta)*10;

    uniforms.amplitude.value = Math.sin(delta);

    renderer.render(scene,camera);
    requestAnimationFrame(update);
}

requestAnimationFrame(update);



