var load = function() {
	var d = new $.Deferred();
	$.get('data/tweets.json').then(function(x) { d.resolve(x); });
	return d.promise()
};

function assert(test, message) {
	if (!test) {throw new Error(message);}
}

function trim(str, chars) {
    return ltrim(rtrim(str, chars), chars);
}
  
function ltrim(str, chars) {
    chars = chars || "\s";
    return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
}
  
function rtrim(str, chars) {
    chars = chars || "\s";
    return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
}

var tokenize = function(val) {
	return val.split(' ').map(function(x) {
		return trim(x.trim().toLowerCase(),'\@\#\.\!\(\)\,\"\'\-'); 
	}).filter(function(x) { return x.length; });
};

var update_map = function(map, tokens) {
	tokens.map(function(t) {
		var prev_count = map[t] || 0;
		map[t] = prev_count + 1;
	});
};

var range = function(i) {
	var v = [];
	for (var ii = 0; ii < i; ii++) { v.push(ii); }
	return v;
};

var to_fvs = function(keylist, tokens) {
	return normalise(keylist.map(function(k) {
		return tokens.filter(function(x) { return x == k; } ).length;
	}));
};

var dict_size = 100;

var build_fvs_from_corpus = function(map, texts) {
	// expects [ { text: "blah blah" } ... ]
	map = map || {};
	texts.map(function(t) {
		t.tokens = tokenize(t.text); 
		update_map(map, t.tokens);
	});	
	// find the most frequent keys
	var keys = _(map).keys().concat([]);
	keys.sort(function(x,y) { return map[y] - map[x]; });

	// choose a dictionary.
	var dict = keys.slice(0,dict_size);
	console.log('using dictionary ', dict);

	// make fvs out of them
	texts.map(function(t) {  t.fv = to_fvs(dict,t.tokens); 	t.map = map; });
	return texts;
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
	var scene = new THREE.Scene();
	scene.add(camera);
	// camera.position.z = 900;
	// camera.rotation.y = Math.PI;
	// camera.rotation.x = Math.PI;
	// camera.rotation.z = 0;	
	// camera.rotation.x = -0.4;
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

var sum = function(l) {
	return l.reduce(function(x,y) { return x + y; }, 0);
};
var vec_similarity = function(v1,v2) {
	// cosine similiarity a*b / |a||b|
	return vec_dot(v1,v2)/(1.0*vec_len(v1)*vec_len(v2));
};
var vec_dot = function(v1,v2) {
	assert(v1.length == v2.length, 'lengths must be same');
	return sum(range(v1.length).map(function(i) { return v1[i] * v2[i]; }));
};
var vec_len = function(v) {
	return Math.sqrt(sum(v.map(function(x) { return x*x; })));
};
var vec_add = function(v1,v2) {
	assert(v1.length == v2.length, 'lengths must be same ' + v1.length + " " + v2.length);	
	return range(v1.length).map(function(i) { return v1[i] + v2[i]; });
}
var vec_muls = function(v1,s) {
	return v1.map(function(vi) { return vi*s; });
};
var zeros = function(l) {
	var p = [];
	range(l).map(function() {
		p.push(0);
	});
	return p;
};
var normalise = function(v) {
	return vec_muls(v,1.0/vec_len(v));
};

var shuffled = function(l) {
	l = l.concat([]);
	l.sort(function(x,y) { return Math.random() - Math.random(); });
	return l;
};

var kmeans = function(texts) {
	// choose n centroids
	// randomly permute;
	var N = 3;		
	var tidx_range = range(texts.length);
	var centroid_is = shuffled(tidx_range).slice(0,N); 
	var centroids = centroid_is.map(function(c_i) { return texts[c_i].fv.concat([]); });
	var iters = 10;
	var memberships = [];
	
	range(iters).map(function(iter) {
		// iterate n times
		// E step
		// similarity to each centroid
		console.log(' iteration .. ', iter);
		memberships = tidx_range.map(function(t_i) {
			var membership = centroids.map(function(c) {
				// skip				
				return vec_similarity( c, texts[t_i].fv );				
			});
			return membership;
		});

		// console.log('memberships ', memberships);
		// [
		//   [ x0c0, x0c1, x0c2 ] - x0,
		//   [ x0c0, x0c1, x0c2 ] - x1 ,
		//   [ ...
		//                           ]
		// now computing new cluster centroids -- sum partial memberships
		
		var new_centers = range(N).map(function(c_i) {	return zeros(texts[0].fv.length);});
		tidx_range.map(function(t_i) {
			// let's try hard assignment			
			var fv = texts[t_i].fv
			// debug
			var ti_0 = memberships[t_i][0];
			var ti_1 = memberships[t_i][1];
			var ti_2 = memberships[t_i][2];
			// -
			var idxs = range(3);
			idxs.sort(function(x,y) { return memberships[t_i][y] - memberships[t_i][x]; });
			var top_idx = idxs[0];
			new_centers[top_idx] = vec_add(new_centers[top_idx], fv);
		});
		
		centroids = new_centers.map(function(v) { return normalise(v); });
	});
	// put them back in
	tidx_range.map(function(t_i) { texts[t_i].membership = memberships[t_i]; });
	return centroids;
};

$(document).ready(function() {
	var sc = set_up_camera();
	window.sc = sc;		
	load().then(function(d) {
		console.log('got >> ', d);
		window.texts = build_fvs_from_corpus( undefined, d );
		window.centroids = kmeans(window.texts);
		make_particles(sc.scene, window.texts.map(function(t) { return t.membership; }));
		sc.renderer.render(sc.scene,sc.camera);
		cam_rot(0,Math.PI,0);
		start_drawing();
	});
	make_listeners();
});
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
	requestAnimationFrame(arguments.callee);
};

var draw = function() {
	window.sc.renderer.render(sc.scene,sc.camera);			
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
	
	$('.xmin').on('click', function() { });
};
