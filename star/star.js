/*jshint esversion: 6 */

/* ORL - 2/8/18
 *
 * Notes:
 *
 * */



class DistantStar{

    constructor(temp, position, scale, camera, scene){
        this.temperature = temp;
        this.position = position;
        this.scale = scale;
        this.camera = camera;
        this.scene = scene;

        //limit the temperature range
        if(temp < 800){
            this.temperature = 800.0;
        }
        else if(temp>30000.0){
            this.temperature = 30000.0;
        }

        //set some constants
        this.DSUN = 1392684.0; //solar radius [km]
        this.TSUN = 5778.0; //solar temp [K]

        //create the star dimensions based on the temp and scale
        //TODO
        this.star_radius = this.starRadiusFromTemp();
        this.resolution = 100;

        //this is set to true when the textures are all loaded
        this.ready = false;


        this.num_points = 10; //the number of points to raycast to on the star
        this.glow_size_scale = 1.0; //init to 1

        this.group = new THREE.Group();


        //store the color data for the star-temp here
        this.star_color_data = [];

        //IMPORTANT: this function call here kicks off the whole init process
        this.loadImageTexture();

//        var texture = new THREE.TextureLoader().load("star_glow.png", 
//            (function(texture){
//                this.uniforms/texture.value = texture;
//                this.loadImageTexture();
//            }).bind(this));
        
        this.uniforms = {
            colorbar:{
                type:"fv1",
                value:[]
            },
            texture:{
                type:"t",
                value: new THREE.TextureLoader().load("star_glow.png")
            },
            temperature:{
                type:"f",
                value:this.temperature
            }
        };

            


        //the shaders for the star glow
        this.vShader = 
            "varying vec2 vUv;\n"+
            "void main()	{\n"+
            "vUv = uv;\n"+
                "gl_Position = projectionMatrix*\n"+
                              "modelViewMatrix*\n"+
                              "vec4( position, 1.0 );\n"+
            "}\n"
        ;

        this.fShader = 
            "varying vec2 vUv;\n"+
            "uniform float colorbar[12];\n"+
            "uniform sampler2D texture;\n"+
            "uniform float temperature;\n"+
            "void main()	{\n"+
                "vec3 final_c;\n"+
                "vec4 c_tex = texture2D(texture, vUv);\n"+
                "float tex_r = c_tex.r; //get the grayscale from r (since all same)\n"+
                "float magic_sauce = 0.00007*temperature+0.6;\n"+
                "if(magic_sauce<1.0){\n"+
                    "magic_sauce = 1.0;\n"+
                "}\n"+
                "float color_y = (1.0-tex_r+0.125)*3.0;\n"+
                "int base = int(floor(color_y));\n"+
                "float c_fact = color_y-float(base);\n"+
                "if (base==0){\n"+
                    "vec3 c1 = vec3(colorbar[0],colorbar[1],colorbar[2]);\n"+
                    "vec3 c2 = vec3(colorbar[3],colorbar[4],colorbar[5]);\n"+
                    "final_c = (c1*(1.0-c_fact) + c2*c_fact)*magic_sauce;\n"+
                "}\n"+
                "else if (base==1){\n"+
                    "vec3 c1 = vec3(colorbar[3],colorbar[4],colorbar[5]);\n"+
                    "vec3 c2 = vec3(colorbar[6],colorbar[7],colorbar[8]);\n"+
                    "final_c = (c1*(1.0-c_fact) + c2*c_fact)*magic_sauce;\n"+
                "}\n"+
                "else if (base==2){\n"+
                    "vec3 c1 = vec3(colorbar[6],colorbar[7],colorbar[8]);\n"+
                    "vec3 c2 = vec3(colorbar[9],colorbar[10],colorbar[11]);\n"+
                    "final_c = (c1*(1.0-c_fact) + c2*c_fact)*magic_sauce;\n"+
                "}\n"+
                "else{\n"+
                    "final_c = vec3(colorbar[9], colorbar[10], colorbar[11])*\n"+
                        "magic_sauce;\n"+
                "}\n"+
                "gl_FragColor = vec4(final_c*c_tex.rgb, 1.0);\n"+
            "}\n"
        ;




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
        
        this.star_billboard.scale.set(size*this.scale*this.glow_size_scale, 
            size*this.scale*this.glow_size_scale,1);
    }


    updateStar(objs){
        if(this.ready){
            this.getStarOccultationFraction(objs);
        }
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
        //this.star_billboard.material.opacity = count/this.num_points;
        this.glow_size_scale = count/this.num_points;
        if(this.glow_size_scale == 0){
            this.star_billboard.material.visible = false;
        }
        else{
            this.star_billboard.material.visible = true;
            this.updateGlowSize();
        }
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

    loadImageTexture(){
        /* Load the star_spectrum.png texture to get the colobar values
         * we'll use to color the star glow.
         * */
        var filepath = "star_spectrum.png";

        var callback = (function(image){
            var canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            var context = canvas.getContext('2d');
            context.drawImage(image,0,0);

            var data = context.getImageData(0,0,image.width,image.height);
            this.initStarWithTextures(data);
        }).bind(this);

        var loader = new THREE.ImageLoader();
        loader.load(filepath, callback, undefined, function(){console.error(
            "Error: couldn't load star temp colorbar image.");});
    }


    initStarWithTextures(data){
        /* This CB will init the star, it is called after the textures are 
         * loaded.
         * */
        this.ready = true;
        this.star_color_data = data;

        var x_pos = this.getStarBillboardX();

        this.uniforms.colorbar.value = this.getBillboardArray(x_pos);

        //create the star billboard, texture by: Andreas Ressl and Georg Hammershmid
        //var texture = new THREE.TextureLoader().load("star_glow.png");
        var geometry = new THREE.PlaneBufferGeometry(this.star_radius*80,
            this.star_radius*80);
        //var material = new THREE.MeshBasicMaterial( {map: texture} );
        var shaderMaterial = new THREE.ShaderMaterial({
            vertexShader: this.vShader,
            fragmentShader: this.fShader,
            uniforms: this.uniforms
        });
        //material.transparent = true;
        //material.blending = THREE.AdditiveBlending;
        shaderMaterial.transparent = true;
        shaderMaterial.blending = THREE.AdditiveBlending;
        this.star_billboard = new THREE.Mesh( geometry, shaderMaterial);
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


        //create the star sphere (the actual star), just a sphere
        var color = this.getStarColor(x_pos);
        var star_color = new THREE.Color(color.r/255.0, color.g/255.0, color.b/255.0);
        var star_sphere_mat = new THREE.MeshBasicMaterial({color:star_color});
        star_sphere_mat.blending = THREE.AdditiveBlending;
        var star_sphere_geo = new THREE.SphereBufferGeometry(
            this.star_radius*this.scale,this.resolution,this.resolution);
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

    getStarColor(x){
        //get the average x colors
        var pos_fl = Math.floor(x)*4;
        var pos_cl = Math.ceil(x)*4;
        var data = this.star_color_data.data;

        var fl_fact = 0;
        var cl_fact = 0;

        if(pos_fl/4 == x){
            fl_fact = 0.5;
            cl_fact = 0.5;
        }
        else{
            fl_fact = x-pos_fl/4;
            cl_fact = pos_cl/4-x;
        }

        var shift = this.getTempColorShift();

        return { r: shift[0]*(data[pos_fl]*fl_fact + data[pos_cl]*cl_fact), 
                 g: shift[1]*(data[pos_fl+1]*fl_fact + data[pos_cl+1]*cl_fact), 
                 b: shift[2]*(data[pos_fl+2]*fl_fact + data[pos_cl+2]*cl_fact), 
                 a: data[pos_fl+3]*fl_fact + data[pos_cl+3]*cl_fact
        };
    }

    getBillboardArray(x){
        //get the average x colors
        var width = 1024;
        var pos_fl = Math.floor(x)*4;
        var pos_cl = pos_fl + 4;
        var data = this.star_color_data.data;

        var fl_fact = 0;
        var cl_fact = 0;

        if(pos_fl/4 == x){
            fl_fact = 0.5;
            cl_fact = 0.5;
        }
        else{
            fl_fact = 1.0-(x-pos_fl/4);
            cl_fact = 1.0-(pos_cl/4-x);
        }

        var pos1 = pos_fl;
        var pos2 = pos_fl+width*4;
        var pos3 = pos_fl+(width*2)*4;
        var pos4 = pos_fl+(width*3)*4;

        var result = [data[pos1]*fl_fact/255.0 + data[pos1]*cl_fact/255.0,
                      data[pos1+1]*fl_fact/255.0 + data[pos1+1]*cl_fact/255.0,
                      data[pos1+2]*fl_fact/255.0 + data[pos1+2]*cl_fact/255.0,
                      data[pos2]*fl_fact/255.0 + data[pos2]*cl_fact/255.0,
                      data[pos2+1]*fl_fact/255.0 + data[pos2+1]*cl_fact/255.0,
                      data[pos2+2]*fl_fact/255.0 + data[pos2+2]*cl_fact/255.0,
                      data[pos3]*fl_fact/255.0 + data[pos3]*cl_fact/255.0,
                      data[pos3+1]*fl_fact/255.0 + data[pos3+1]*cl_fact/255.0,
                      data[pos3+2]*fl_fact/255.0 + data[pos3+2]*cl_fact/255.0,
                      data[pos4]*fl_fact/255.0 + data[pos4]*cl_fact/255.0,
                      data[pos4+1]*fl_fact/255.0 + data[pos4+1]*cl_fact/255.0,
                      data[pos4+2]*fl_fact/255.0 + data[pos4+2]*cl_fact/255.0];
        return result;
    }


    getStarBillboardX(){
        /* Get the X position in the star color spectrum texture to load
         * the appropriate color.
         * */

        //IMPORTANT: the spectrum has to be 1024 long!
        return (this.temperature-800.0)/29200.0*1024.0;
    }

    
    getTempColorShift(){
        var r = this.temperature*(0.0534/255.0)-(43.0/255.0);
        var g = this.temperature*(0.0628/255.0)-(77.0/255.0);
        var b = this.temperature*(0.0735/255.0)-(115.0/255.0);
        return [r,g,b];
    }


    starRadiusFromTemp(){
        /*
        Get the estimated radius from the star.
        Returns the star radius in [km]
        */
        var T = this.temperature;
        var rad = 0;
        if (T >= 4200.0){ //the upper limit for the Mann (2015) equation
            rad = 0.000196203*T - 0.134051;
        }
        else if( T >= 2729.0){ //the limit where the Mann equation is valid
            var t_mod = T/3500.0;
            rad = 10.554-33.7546*t_mod+35.1909*Math.pow(t_mod,2)-
                11.5928*Math.pow(t_mod,3);
        }
        else if( T >= 2300.0 ){
            rad = 0.0001*T-0.1389;
        }
        return rad*this.DSUN/2.0;
    }



}






