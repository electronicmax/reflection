require(['js/utils.js','js/em.js'], function(u,em) {
	var load = function() {
		var d = new $.Deferred();
		$.get('data/tweets.json').then(function(x) { d.resolve(x); });
		return d.promise()
	};
	
	var add_axes = function(scene) {
		// x-axis
		var texture = THREE.ImageUtils.loadTexture( "img/10.jpg" );
		var material = new THREE.MeshLambertMaterial({color:0xFF0000}); // new THREE.MeshBasicMaterial({color:0xAAFF44,map:texture }); //
		var plane = new THREE.Mesh(new THREE.PlaneGeometry(1,100), material);
		window.clock = new THREE.Clock();
		// plane.doubleSided = true;
		scene.add(plane);
		// material = new THREE.MeshBasicMaterial({color:0x00FF00, wireframe:false}); //MeshLambertMaterial({color:0xFF0000});
		plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 100), material);
		plane.doubleSided = true;
		plane.position.x = 0;
		plane.rotation.y = Math.PI/2.0;
		// scene.add(plane);

		// material = new THREE.MeshBasicMaterial({color:0x0000FF, wireframe:false}); //MeshLambertMaterial({color:0xFF0000});

		plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 100), material);
		plane.doubleSided = true;
		plane.rotation.x = Math.PI/2.0;
		scene.add(plane);
	};
	var set_up_camera = function() {
		// set the scene size
		var WIDTH = $(document).width(), HEIGHT = $(document).height();
		// set some camera attributes
		var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1,FAR = 10000;
		// create a WebGL renderer, camera
		// and a scene
		var renderer = new THREE.WebGLRenderer();
		var camera = new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);
		window.controls = new THREE.FirstPersonControls( camera );
		var scene = new THREE.Scene();

		var light = new THREE.PointLight( 0xffffff, 1.5 );
		light.position.set( 0, 0, 0 );
		scene.add( light );


		var ambientLight = new THREE.AmbientLight( 0x606060 );
		scene.add( ambientLight );
		
		var directionalLight = new THREE.DirectionalLight( 0xffffff );
		directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
		scene.add( directionalLight );

		scene.add(camera);
		renderer.setSize(WIDTH,HEIGHT);
		$('#container').append(renderer.domElement);
		return { scene : scene, camera: camera, renderer:renderer };
	};

	var radius = 50, segments = 24, rings = 20;
	var mat = new THREE.MeshBasicMaterial({
		color:0xAAAAAA,
		wireframe:true,
		wireframeLinewidth :1
	});
	var nseg = 200;
	var mkfloor = function(sc) {
		var g = new THREE.Geometry();
		var gv = g.vertices;
		var wx = 6, wy = 6;
		for (var i = 0; i < nseg; i++) {
			for (var j = 0; j < nseg; j++) {
				gv.push(new THREE.Vector3( i*wx, j*wy, 0 ));
			}
		}
		for (var i = 0; i < nseg - 1; i++) {
			for (var j = 0; j  < nseg - 1; j++) {
				var a = i + nseg * j;
				var b = i + nseg * ( j + 1 );
				var c = ( i + 1 ) + nseg * ( j + 1 );
				var d = ( i + 1 ) + nseg * j;
				var face = new THREE.Face4( a, b, c, d );
				g.faces.push(face);
			}
		}	
		// g.computeBoundingSphere(); g.computeTangents();
		// g.computeCentroids();
		g.computeFaceNormals();
		g.dynamic = true;
		var fl = new THREE.Mesh(g, mat); // new THREE.MeshNormalMaterial());
		sc.scene.add(fl);
		fl.rotation.x = (Math.PI/2 + 0.6);	
		fl.position.x = -(wx * nseg/2);
		fl.position.y = 0; // -(wy * nseg/9);
		fl.position.z = 0;
		return fl;
	};
	var make_listeners = function() {
		var update_display = function() {
			var r = get_cam_rot();
			$('.display_rotx').html(r.x % (2*Math.PI));
			$('.display_roty').html(r.y % (2*Math.PI));
			$('.display_rotz').html(r.z % (2*Math.PI));				
		};
		var rotate_offset = function(x,y,z) {
			var r = get_cam_rot();
			var to = { x: r.x + x, y:  r.y + y, z: r.z + z };
			console.log(' r ', r, ' to: ', to);
			window.tween = new TWEEN.Tween(r).to(to, 100);
			tween.onUpdate(function() {
				cam_rot(this.x, this.y, this.z);;
				update_display();
			});
			tween.start();
		};
		$('.xmin').on('click', function() { rotate_offset( -0.25, 0, 0 ); } );
		$('.xpls').on('click', function() { rotate_offset( 0.25, 0, 0 ); } );
		$('.ymin').on('click', function() { rotate_offset( 0, -0.25, 0 ); } );
		$('.ypls').on('click', function() { rotate_offset( 0, 0.25, 0 ); } );
		$('.zmin').on('click', function() { rotate_offset( 0, 0, -0.25 ); } );
		$('.zpls').on('click', function() { rotate_offset( 0, 0, 0.25 ); } );

	};	

	var make_sphere = function(scene,r,x,y,z) {
		var sphere_geo = new THREE.Particle();
		var sphere = new THREE.Mesh(sphere_geo, mat);
		scene.add( sphere );
		sphere.position.x = x;
		sphere.position.y = y;
		sphere.position.z = z;		
		return sphere;
	};
	var make_particles = function(scene,positions) {
		var particle = new THREE.Geometry();
		positions.map(function(p) { particle.vertices.push( new THREE.Vector3( p[0], p[1], p[2] ) ); });
		scene.add(new THREE.ParticleSystem( particle, new THREE.ParticleBasicMaterial({size:0.01, color:0x10}) ));
	};


	/*
	  $(window).on('mousemove', function(evt) {
	  // console.log(evt);
	  // fl.position.z = 0.8*evt.pageY;
	  // fl.position.z =	
	  var i = (evt.pageY/(1.0*$(document).height()));
	  var j = (evt.pageX/(1.0*$(document).width()));
	  console.log('x ', 2*Math.PI*i, ' y ', 2*Math.PI*j);
	  sc.camera.rotation.x  = 2*Math.PI*i;
	  sc.camera.rotation.y  = 2*Math.PI*j;
	  sc.renderer.render(sc.scene,sc.camera);			

	  });
	*/


	var cam_rot = function(x,y,z) {
		window.sc.camera.rotation.x = x || 0;
		window.sc.camera.rotation.y = y || 0;
		window.sc.camera.rotation.z = z || 0;	
		// draw();
	};
	var cam_pos = function(x,y,z) {
		window.sc.camera.position.x = x || 0;
		window.sc.camera.position.y = y || 0;
		window.sc.camera.position.z = z || 0;	
		// draw();
	};
	var get_cam_rot = function() {
		return { x: window.sc.camera.rotation.x, y: window.sc.camera.rotation.y, z: window.sc.camera.rotation.z,  };
	};

	var start_drawing = function() {
		draw();
		TWEEN.update();
		var delta = clock.getDelta(), time = clock.getElapsedTime() * 10;
		controls.update(delta);
		requestAnimationFrame(arguments.callee);
	};

	var draw = function() {
		window.sc.renderer.render(sc.scene,sc.camera);			
	};

	$(document).ready(function() {
		var sc = set_up_camera();
		add_axes(sc.scene);		
		window.sc = sc;		
		load().then(function(d) {
			console.log('loaded >> ', d.length);
			var texts = em.build_fvs_from_corpus( undefined, d );
			var centroids = em.kmeans(texts);
			make_particles(sc.scene, texts.map(function(t) { return t.membership; }));
			sc.renderer.render(sc.scene,sc.camera);
			cam_rot(0,Math.PI,0);
			start_drawing();
			
			// debug
			window.texts = texts;
			window.centroids = centroids;
		});
		make_listeners();
	});

});
