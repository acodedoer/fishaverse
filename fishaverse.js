AFRAME.registerComponent('boids', {
    schema: {
        agent:{type: 'string', default: ""},
        population:{type:'number', default:20},
        posXLimit:{type:'number', default:20},
        negXLimit:{type:'number', default:-20},
        posYLimit:{type:'number', default:20},
        negYLimit:{type:'number', default:0},
        posZLimit:{type:'number', default:20},
        negZLimit:{type:'number', default:-20},
        visualRange:{type:'number', default: 50},
        centeringFactor:{type:'number', default:0.005}, 
        minSeparation:{type:'number', default:10},
        avoidanceFactor:{type:'number', default:0.05},
        matchingFactor:{type:'number', default:0.8},
        speedLimit:{type:'number', default:0.5},
        turnFactor:{type:'number', default:0.05},
    },

    init: function(){
        this.boids = [];
        this.predators=[];
        this.initialiseBoids()
        
    },

    initialiseBoids:function() {
        for (let i = 0; i < this.data.population; i += 1) {
            const boid = document.createElement("a-entity");
            if(this.data.predatorLevel>0){
                boid.className="predator";
            }
            boid.setAttribute("mixin",this.data.agent)
            boid.object3D.position.x=this.getRandom(this.data.negXLimit, this.data.posXLimit);
            boid.object3D.position.y=this.getRandom(this.data.negYLimit, this.data.posYLimit);
            boid.object3D.position.z=this.getRandom(this.data.negZLimit, this.data.posZLimit);
            this.boids[i] = {
                el: boid,
                dx: Math.random(),
                dy: Math.random(),
                dz: Math.random(),
                velocity:new THREE.Vector3(Math.random(),Math.random(),Math.random())
            };
            document.querySelector("a-scene").appendChild(boid);
            this.predators = document.querySelectorAll(".predator")
            this.obstacle = document.querySelector(".obstacle")
        }
    },

    updateBoids: function(dt){
        this.boids.forEach(boid => {
            boid.velocity.add(this.velocityToCenter(boid));
            boid.velocity.add(this.separationDistance(boid));
            boid.velocity.add(this.flockVelocity(boid));
            this.stayWithinLimit(boid);
            this.capBoidVelocity(boid);
            //boid.velocity.normalize();
            boid.el.object3D.position.x+= boid.velocity.x *(dt/100);
            boid.el.object3D.position.y+= boid.velocity.y *(dt/100);
            boid.el.object3D.position.z+= boid.velocity.z *(dt/100);

            const dir = boid.velocity.clone();
            dir.multiplyScalar(10);
            dir.add(boid.el.object3D.position);
            boid.el.object3D.lookAt(dir);
            boid.el.setAttribute("data-velocity-x",`${dir.x}`)
            boid.el.setAttribute("data-velocity-y",`${dir.y}`)
            boid.el.setAttribute("data-velocity-z",`${dir.z}`)
        });
    },

    stayWithinLimit: function (boid) {
        if (boid.el.object3D.position.x < this.data.negXLimit) {
            boid.velocity.x += this.data.turnFactor;
        }
        if (boid.el.object3D.position.x > this.data.posXLimit) {
            boid.velocity.x -= this.data.turnFactor
        }
        if (boid.el.object3D.position.y < this.data.negYLimit) {
            boid.velocity.y += this.data.turnFactor;
        }
        if (boid.el.object3D.position.y > this.data.posYLimit) {
            boid.velocity.y -= this.data.turnFactor;
        }
        if (boid.el.object3D.position.z < this.data.negZLimit) {
            boid.velocity.z += this.data.turnFactor;
        }
        if (boid.el.object3D.position.z > this.data.posZLimit) {
            boid.velocity.z -= this.data.turnFactor;
        }
    },

    separationDistance: function (boid) {
        const distance = new THREE.Vector3(0, 0, 0);
        for (let otherBoid of this.boids) {
          if (otherBoid !== boid) {
            if (this.distanceBetweenBoids(boid, otherBoid) < this.data.minSeparation) {
              distance.add(boid.el.object3D.position);
              distance.sub(otherBoid.el.object3D.position);
            }
          }
        }
        
        return distance.multiplyScalar(this.data.avoidanceFactor);
    }, 

    flockVelocity: function (boid) {
        const velocity = new THREE.Vector3(0,0,0);
        let neighbours = 0;
        this.boids.forEach(otherBoid => {
            if (this.distanceBetweenBoids(boid, otherBoid) < this.data.visualRange){
                velocity.add(otherBoid.velocity);
                neighbours += 1;
            }      
        });
        velocity.divideScalar(neighbours);
        velocity.sub(boid.velocity);
        return velocity.multiplyScalar(this.data.matchingFactor);
    }, 

    capBoidVelocity: function(boid) {
        const velocity = new THREE.Vector3(0,0,0);
        const vel = boid.velocity.length();
        if((vel>this.data.speedLimit)){
            boid.velocity.divideScalar(vel);
            boid.velocity.multiplyScalar(this.data.speedLimit)
        }
    },

    velocityToCenter: function(boid){
        let neighbours = 0;
        const velocity = new THREE.Vector3(0,0,0);
        
        for (let otherBoid of this.boids) {
            if (this.distanceBetweenBoids(boid, otherBoid) < this.data.visualRange){
                velocity.add(otherBoid.el.object3D.position);
                neighbours += 1;
            }      
        }
    
        if(neighbours){
            velocity.divideScalar(neighbours);
            velocity.sub(boid.el.object3D.position);
            velocity.multiplyScalar(this.data.centeringFactor);
        }        
        return velocity;
    },

    distanceBetweenBoids: function(boid1, boid2){
        return boid1.el.object3D.position.distanceTo(boid2.el.object3D.position);
    },

    getRandom: function (min, max){
        return Math.random() * (max - min) + min;
    },

    tick(t, dt){
        this.updateBoids(dt)
    }
})

AFRAME.registerComponent('illuminate', {
    schema: {
        glow: {type:'boolean', default: 'true'},
        matColor:{type: 'color', default: '#ff0000'},
        glowColor:{type:'color', default:'#ffff00'},
        matOpacity: {type:'number', default:0.5},
        glowOpacity: {type:'number', default:0.5},
        matIntensity: {type:'number', default:1},
        glowScalar: {type:'number', default:1},
        light: {type:'boolean', default:false}
    },
    init: function () {
        this.el.addEventListener('model-loaded', () => {
            const mesh = this.el.getObject3D('mesh');
            mesh.traverse(node => 
                {
                    if (node.hasOwnProperty('material')) {
                        node.material.color = new THREE.Color( this.data.matColor );
                        node.material.opacity= this.data.matOpacity;
                        node.material.emissive=new THREE.Color( this.data.matColor );
                        node.material.emissiveIntensity = this.data.matIntensity;
                    }
                }
            );
        });
        
        if(this.data.glow){
            const texture = new THREE.TextureLoader().load( 'assets/sprites/glow.png' );
            const material = new THREE.SpriteMaterial( { map: texture, color: this.data.glowColor, opacity: this.data.glowOpacity, transparent: true, blending: THREE.AdditiveBlending } );
            material.renderOrder=10000;
            material.depthTest = false;
            material.depthWrite = false;
            const sprite = new THREE.Sprite( material );
            const scalar = 25 * this.data.glowScalar;
            sprite.scale.set(scalar, scalar, scalar);
            this.el.object3D.add(sprite);
        }
    }
});

AFRAME.registerComponent('star-system', {
    schema: {
      color: {
        type: 'string',
        default: "#FFF"
      },
      radius: {
        type: 'number',
        default: 300,
        min: 0,
      },
      depth: {
        type: 'number',
        default: 300,
        min: 0,
      },
      size: {
        type: 'number',
        default: 1,
        min: 0,
      },
      count: {
        type: 'number',
        default: 10000,
        min: 0,
      },
      texture: {
        type: 'asset',
        default: ''
      }
    },
  
    update: function() {
      // Check for and load star sprite
      let texture = {};
      if (this.data.texture) {
        texture.transparent = true;
        texture.map = new THREE.TextureLoader().load(this.data.texture);
      }
  
      const stars = new THREE.BufferGeometry();
      var positions = new Float32Array( numStars * 3 );
      console.log(stars.attributes)
      // Randomly create the vertices for the stars
      while (stars.vertices.length < this.data.count) {
          stars.vertices.push(this.randomVectorBetweenSpheres(this.data.radius, this.data.depth));
      }
  
      // Set the star display options
      const starMaterial = new THREE.PointsMaterial(Object.assign(texture, {
        color: this.data.color,
        size: this.data.size
      }));
  
      // Add the star particles to the element
      this.el.setObject3D('star-system', new THREE.Points(stars, starMaterial));
    },
  
    remove: function() {
      this.el.removeObject3D('star-system');
    },
  
    // Returns a random vector between the inner sphere
    // and the outer sphere created with radius + depth
    randomVectorBetweenSpheres: function(radius, depth) {
      const randomRadius = Math.floor(Math.random() * (radius + depth - radius + 1) + radius);
      return this.randomSphereSurfaceVector(randomRadius);
    },
  
    // Returns a vector on the face of sphere with given radius
    randomSphereSurfaceVector: function(radius) {
      const theta = 2 * Math.PI * Math.random();
      const phi = Math.acos(2 * Math.random() - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    }
  });
