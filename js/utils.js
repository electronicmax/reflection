define([],function() {

	

	return {
		assert: function(test, message) {
			if (!test) {throw new Error(message);}
		},
		trim:function(str, chars) {
			return this.ltrim(this.rtrim(str, chars), chars);
		},
		ltrim: function(str, chars) {
			chars = chars || "\s";
			return str.replace(new RegExp("^[" + chars + "]+", "g"), "");
		},
		rtrim:function(str, chars) {
			chars = chars || "\s";
			return str.replace(new RegExp("[" + chars + "]+$", "g"), "");
		},
		tokenize: function(val) {
			var this_ = this;
			return val.split(' ').map(function(x) {
				return this_.trim(x.trim().toLowerCase(),'\@\#\.\!\(\)\,\"\'\-'); 
			}).filter(function(x) { return x.length; });
		},
		update_map : function(map, tokens) {
			tokens.map(function(t) {
				var prev_count = map[t] || 0;
				map[t] = prev_count + 1;
			});
		},
		range : function(i) {
			var v = [];
			for (var ii = 0; ii < i; ii++) { v.push(ii); }
			return v;
		}
	};
});
	
