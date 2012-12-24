
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
	camera.position.z = 300;
	renderer.setSize(WIDTH,HEIGHT);
	$('#container').append(renderer.domElement);
	return { scene : scene, camera: camera };
};

var sphere = function(scene) {
	// set up the sphere vars
	var radius = 50, segments = 16, rings = 16;
	// create a new mesh with
	// sphere geometry - we will cover
	// the sphereMaterial next!
	var sphere = new THREE.Mesh(new THREE.SphereGeometry(radius,segments,rings), sphereMaterial);
	// add the sphere to the scene
	scene.add(sphere);
	
	// create the sphere's material
	var sphereMaterial = new THREE.MeshLambertMaterial(  {  color: 0xCC0000  });

	// create a point light
	var pointLight = new THREE.PointLight(0xFFFFFF);

	// set its position
	pointLight.position.x = 10;
	pointLight.position.y = 50;
	pointLight.position.z = 130;
	// add to the scene
	scene.add(pointLight);
};

$(document).ready(function() {
	var sc = set_up();
	sphere(sc.scene);
	renderer.render(sc.scene,sc.camera);
});
