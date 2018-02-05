var vShader = 
    "varying vec2 vUv;\n"+
    "varying vec3 vPos;\n"+
    "varying vec3 vNorm;\n"+
    "attribute float displacement;\n"+
    "uniform float amplitude;\n"+
	"void main()	{\n"+
        "vec3 newPosition = position + normal*vec3(displacement*amplitude);\n"+
        "vUv = uv;\n"+
        "vPos = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;\n"+
        "vNorm = (modelViewMatrix * vec4(normal,0.0)).xyz;\n"+
		"gl_Position = projectionMatrix*\n"+
                      "modelViewMatrix*\n"+
                      "vec4( newPosition, 1.0 );\n"+
	"}\n"
;

var fShader = 
    "varying vec2 vUv;\n"+
    "varying vec3 vPos;\n"+
    "varying vec3 vNorm;\n"+
    "struct PointLight{\n"+
        "vec3 color;\n"+
        "vec3 position;\n"+
        "float distance;\n"+
    "};\n"+
    "uniform PointLight pointLights[NUM_POINT_LIGHTS];\n"+
	"void main()	{\n"+
        "vec4 addedLights = vec4(0.0,0.0,0.0,1.0);\n"+
        "for(int i=0; i<NUM_POINT_LIGHTS; i++){\n"+
            "vec3 lightDir = normalize(vPos - pointLights[i].position);\n"+
            "addedLights.rgb += clamp(dot(-lightDir,vNorm),0.0,1.0)*\n"+
                "pointLights[i].color;\n"+
        "}\n"+
		"gl_FragColor = addedLights;\n"+
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

var uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.lights,
    {
        amplitude: {
            type: "f",
            value: 0
        }
    }]);

var shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vShader,
    fragmentShader: fShader,
    uniforms: uniforms,
    lights: true
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
    randData[i]=(Math.random()*9.0);
}

//create the random array attributes for the geomentry
var attrbts = new THREE.BufferAttribute(randData,1);

sphere.geometry.addAttribute("displacement", attrbts);


sphere.position.z = -300;
scene.add(sphere);

var pointLight = new THREE.PointLight(0x00ffFF);
pointLight.position.x = 0;
pointLight.position.y = 0;
pointLight.position.z = -300;
scene.add(pointLight);

var pointLightHelper = new THREE.PointLightHelper(pointLight, 5);
scene.add(pointLightHelper);

var pL2 = new THREE.PointLight(0xff0000);
pL2.position.z = -300;
scene.add(pL2);
var pL2Helper = new THREE.PointLightHelper(pL2, 5);
scene.add(pL2Helper);


var delta = 0.0001;
function update(){
    delta += 0.1;
    var time = Date.now()*0.0005;
    //sphere.position.x = Math.sin(delta)*10;
    //sphere.position.y = Math.sin(delta)*10;
    //

    if (delta >= Math.pi*2.0){
        delta = 0.0;
    }

    pointLight.position.x = Math.cos(time)*100;
    pointLight.position.z = Math.sin(time)*100 - 300;

    pL2.position.x = Math.cos(time+Math.PI)*100;
    pL2.position.z = Math.sin(time+Math.PI)*100-300;


    uniforms.amplitude.value = Math.sin(delta);

    renderer.render(scene,camera);
    requestAnimationFrame(update);
}

requestAnimationFrame(update);



