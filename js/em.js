define(['js/utils.js'],function(u) {
	var dict_size = 100;
	// vector module
	var sum = function(l) {	return l.reduce(function(x,y) { return x + y; }, 0);	};
	// cosine similiarity a*b / |a||b|
	var vec_similarity = function(v1,v2) {	return vec_dot(v1,v2)/(1.0*vec_len(v1)*vec_len(v2)); };
	var vec_dot = function(v1,v2) {
		u.assert(v1.length == v2.length, 'lengths must be same');
		return sum(u.range(v1.length).map(function(i) { return v1[i] * v2[i]; }));
	};
	var vec_len = function(v) {
		return Math.sqrt(sum(v.map(function(x) { return x*x; })));
	};
	var vec_add = function(v1,v2) {
		u.assert(v1.length == v2.length, 'lengths must be same ' + v1.length + " " + v2.length);	
		return u.range(v1.length).map(function(i) { return v1[i] + v2[i]; });
	}
	var vec_muls = function(v1,s) {
		return v1.map(function(vi) { return vi*s; });
	};
	var zeros = function(l) {
		var p = [];
		u.range(l).map(function() {	p.push(0); });
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
	var to_fvs = function(keylist, tokens) {
		return normalise(keylist.map(function(k) {
			return tokens.filter(function(x) { return x == k; } ).length;
		}));
	};	
	var build_fvs_from_corpus = function(map, texts) {
		// expects [ { text: "blah blah" } ... ]
		map = map || {};
		texts.map(function(t) {
			t.tokens = u.tokenize(t.text); 
			u.update_map(map, t.tokens);
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
	var kmeans = function(texts) {
		// choose n centroids
		// randomly permute;
		var N = 3;		
		var tidx_range = u.range(texts.length);
		var centroid_is = shuffled(tidx_range).slice(0,N); 
		var centroids = centroid_is.map(function(c_i) { return texts[c_i].fv.concat([]); });
		var iters = 10;
		var memberships = [];	
		u.range(iters).map(function(iter) {
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
			
			var new_centers = u.range(N).map(function(c_i) {	return zeros(texts[0].fv.length);});
			tidx_range.map(function(t_i) {
				// let's try hard assignment			
				var fv = texts[t_i].fv
				// debug
				var ti_0 = memberships[t_i][0];
				var ti_1 = memberships[t_i][1];
				var ti_2 = memberships[t_i][2];
				// -
				var idxs = u.range(3);
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
	
	return {
		build_fvs_from_corpus:build_fvs_from_corpus,
		kmeans:kmeans
	};	
});
