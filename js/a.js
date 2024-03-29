
var set_up = function() {
	// set the scene size
	var WIDTH = $(document).width(), HEIGHT = $(document).height();
	// set some camera attributes
	var VIEW_ANGLE = 45, ASPECT = WIDTH / HEIGHT, NEAR = 0.1,FAR = 10000;
	// create a WebGL renderer, camera
	// and a scene
	var renderer = new THREE.WebGLRenderer();
	var camera = new THREE.PerspectiveCamera(VIEW_ANGLE,ASPECT,NEAR,FAR);
	var scene = new THREE.Scene();
	scene.add(camera);
	camera.position.z = 900;
	camera.rotation.x = -0.4;
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

$(document).ready(function() {
	var sc = set_up();
	// window.sphere = mksphere(sc.scene);
	window.fl = mkfloor(sc);	
	perturb_sph(sc);	
	sc.renderer.render(sc.scene,sc.camera);	
	window.sc = sc;
});

var mksphere = function(scene) {
	var sphere_geo = new THREE.SphereGeometry(radius,segments,rings);
	var sphere = new THREE.Mesh(sphere_geo, mat);
	scene.add( sphere );	
	return sphere;
};
var t = 0;
var perturb_sph = function(sc) {
	t += 1;
	var p = arguments.callee;
	/*
	sphere.geometry.vertices.map(function(v) {
	 	v.x = v.x + 0.1*(Math.random() - 0.5);
	 	v.y = v.y + 0.1*(Math.random() - 0.5);
	 	v.z = v.z + 0.1*(Math.random() - 0.5);				
	 });
	// sphere.geometry.verticesNeedUpdate = true;	 
	 */	
	fl.geometry.vertices.map(function(v) {
		v.z = 0.99*v.z; // Math.min(0,v.z + 10*(Math.random()-0.5));
		v.z = v.z + 1*Math.sin((0.02*v.x)+(0.01*v.y)+0.1*t);		
	 });

	fl.geometry.verticesNeedUpdate = true;	
	sc.renderer.render(sc.scene,sc.camera);
	requestAnimationFrame(function() { p(sc); });		
};

$(window).on('mousemove', function(evt) {
	// console.log(evt);
	// fl.position.z = 0.8*evt.pageY;
	// fl.position.z =	
	var i = Math.round(nseg * (evt.pageY/$(document).height()));
	var j = Math.round(nseg * (evt.pageX/$(document).width()));
	console.log(j*nseg + i, fl.geometry.vertices[i*nseg + j]);
	fl.geometry.vertices[j*nseg + i].z = - 100;
	console.log(i*nseg + j, fl.geometry.vertices[i*nseg + j]);
	fl.geometry.verticesNeedUpdate = true;	
});
