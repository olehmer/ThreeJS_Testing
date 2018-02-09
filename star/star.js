/*jshint esversion: 6 */

class DistantStar{

    constructor(temp, position, scale, camera, scene){
        this.temperature = temp;
        this.position = position;
        this.scale = scale;
        this.camera = camera;
        this.scene = scene;

        //set some constants
        this.DSUN = 1392684.0; //solar radius [km]
        this.TSUN = 5778.0; //solar temp [K]

        this.num_points = 50; //the number of points to raycast to on the star

        this.group = new THREE.Group();

        //create the star dimensions based on the temp and scale
        //TODO
        this.star_radius = this.DSUN;
        var resolution = 100;

        //create the star billboard, texture by: Andreas Ressl and Georg Hammershmid
        var texture = new THREE.TextureLoader().load("star_glow.png");
        var geometry = new THREE.PlaneBufferGeometry(this.star_radius*30,
            this.star_radius*30);
        var material = new THREE.MeshBasicMaterial( {map: texture} );
        material.transparent = true;
        material.blending = THREE.AdditiveBlending;
        this.star_billboard = new THREE.Mesh( geometry, material );
        this.star_billboard.position.copy(this.position);
        this.star_billboard.renderOrder = Infinity; //render on top of everything

        this.star_billboard.onBeforeRender = function(renderer, scene,camera, 
                geometry, material, group){
            //the line below will render the star glow behind the planet until occulted
            renderer.clearDepth();
            //always face the camera
            this.quaternion.copy( camera.quaternion );
        };
        this.updateGlowSize();

        var star_sphere_mat = new THREE.MeshBasicMaterial({color:0x000000});
        star_sphere_mat.blending = THREE.AdditiveBlending;
        var star_sphere_geo = new THREE.SphereBufferGeometry(
            this.star_radius*this.scale,resolution,resolution);
        this.star_sphere = new THREE.Mesh(star_sphere_geo, star_sphere_mat);
        this.star_sphere.position.copy(this.position); 
        this.star_sphere.onBeforeRender = function(renderer, scene,camera, 
                geometry, material, group){
            //always face the camera
            this.quaternion.copy( camera.quaternion );
        };

        this.initStarOcclusionPoints();

        //add the star sphere and billboard to a group for rendering
        this.group.add(this.star_sphere, this.star_billboard);
    }


    //Methods
    getStarToRender(){
        return this.group; 
    }

    updateGlowSize(){
        //Update the size of the glow when moving about
        var diam = this.star_radius*2.0*this.DSUN;
        var dist = this.camera.position.distanceTo(this.position)/this.scale;
        var lum = (diam*diam)*Math.pow(this.temperature/this.TSUN,4.0); //luminosity
        var size = 0.016*Math.pow(lum,0.25)/Math.pow(dist,0.5); //size
        
        this.star_billboard.scale.set(size*this.scale, size*this.scale,1);
    }

    updateCamera(camera){
        this.camera = camera;
    }

    updateStar(objs){
        this.getStarOccultationFraction(objs);
    }


    getStarOccultationFraction(objs){
        //add the star sphere to the objs array first
        objs.push(this.star_sphere);

        var count = 0;

        var origin = new THREE.Vector3();
        origin.copy(this.camera.position);
        //loop over the child points of the star
        for(var i=0; i<this.star_sphere.children.length; i++){
            var dest = this.star_sphere.children[i].getWorldPosition();
            count += this.castRay(dest,origin,objs);
        }
        //TODO this should be done in a shader!
        this.star_billboard.material.opacity = count/this.num_points;
    }



    castRay(dest, origin, objs){
        //Cast ray from the camera (origin) to the star (dest)
        //objs is an array of objects to check the ray against for collisions

        var direction = new THREE.Vector3();
        direction.subVectors(dest, origin).normalize();

        var ray = new THREE.Raycaster(origin, direction);
        this.scene.updateMatrixWorld(); //required since we haven't rendered yet

        var intersects = ray.intersectObjects(objs);
        if (intersects[0]){
            //console.log(intersects.length);
            if (intersects.length ==1){
                //star isn't blocked
                return 1;
            }
            else{
                //something is in the way
                return 0;
            }
        }
    }

    initStarOcclusionPoints(){
        //this function will take the radius of the star, and it's position to
        //generate a bunch of points on the star surface. The total visible star
        //fraction will be calculated from raycasts from the camera to the star.
        var radius = this.star_radius*this.scale;

        //the golden ratio
        var phi = 1.618; //(sqrt(5)+1)/2

        var theta;
        for(var i=0; i<this.num_points; i++){
            theta = 2*Math.PI*i/Math.pow(phi,2);
            var rad = Math.sqrt((i-0.5)/this.num_points)*radius;
            var pos = new THREE.Vector3(rad*Math.cos(theta), rad*Math.sin(theta),0);

            var point = new THREE.Points();
            point.visible = false;
            point.position.copy(pos);
            this.star_sphere.add(point);
        }
    }


}






