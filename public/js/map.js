$(function() {
	//location input panel
	var input	= $('#location_input').first();
	var form	= $('#location_form').first();
	var list 	= $('#location_list').first();
	var autocomplete = new google.maps.places.Autocomplete(input[0], {});

	var geocoder = new google.maps.Geocoder();

	var lat = 50.93519;
	var lng = -1.39571; //[ 52.18935168521872, -2.2124576568603516 ],
	var zoom = 15;

	var map = new L.map("map", {
	    // Default centre and zoom
	    center : [ lat, lng ],
	    zoom : zoom
	});

	if(input.val()!=""){
		var location = input.val();
		geocoder.geocode({ 'address': location }, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
                lat = results[0].geometry.location.lat();
                lng = results[0].geometry.location.lng();
				map.setView([lat, lng], zoom);
            }
		});
	}

	google.maps.event.addListener(autocomplete, 'place_changed', function(){

	});

	form.submit(function(){
		var location = input.val();
		if(location != ""){
			geocoder.geocode({ 'address': location }, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var loc = results[0];

					var newloc =	$('<li>'+
									'<span class="place" data-lat="'+loc.geometry.location.lat()+'" data-lng="'+loc.geometry.location.lng()+'"><i class="fa fa-map-marker fa-fw"></i> '+loc.formatted_address+'</span>'+
									'<span class="remove"><i class="fa fa-ban fa-fw"></i></span>'+
									'</li>');

					newloc.find(".place").click(function(){
						map.setView([$(this).data("lat"), $(this).data("lng")], 16);
					});

					newloc.find(".remove fa").click(function(){

					});

					list.append(newloc);

					//add marker
					L.marker([loc.geometry.location.lat(), loc.geometry.location.lng()], {icon : markers.types.user}).bindPopup("<strong>" + loc.formatted_address + "</strong>").addTo(map);
	            }
			});
		}
		input.val("");
		input.focus();
		return false;
	});


	L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
	    maxZoom: 16
	}).addTo(map);

	var sidebar = L.control.sidebar("sidebar").addTo(map);
	map.on("mousedown", function(){
	    if(!L.DomUtil.hasClass(sidebar._sidebar, "collapsed")){
	        sidebar.close();
	    }
	});

	function generatePointInBounds(bounds){
	    var east = bounds.getEast(),
	        west = bounds.getWest(),
	        north = bounds.getNorth(),
	        south = bounds.getSouth();
	    var latlng;

	    do {
	        latlng = L.latLng({
	            lat : north + (Math.random() * (south - north)),
	            lng : west + (Math.random() * (east - west))
	        });
	    } while (!bounds.contains(latlng));
	    return latlng;
	}


	var heatmap = {
	    max : 100,
	    min : 0,
	    getValue : function (min, max) {
	        return Math.floor(Math.random() * (this.max - this.min + 1) + this.min);
	    },
	    getPosition : function(bounds){
	        return generatePointInBounds(bounds);
	    },
	    generatePoint : function(bounds){
	        var point = this.getPosition(bounds);
	        point.value = this.getValue();
	        return point;
	    },
	    generatePoints : function (num, bounds) {
	        num = num || 100;
	        bounds = bounds || map.getBounds().pad(0.2);

	        var result = [];
	        while(num--){
	            result.push(this.generatePoint(bounds));
	        }
	        return result;
	    }
	};

	var hmp = heatmap.generatePoints();

	var heatmapLayer = new HeatmapOverlay({
	    radius: 150,
	    useLocalExtrema: false,
	    valueField: "value"
	});


	heatmapLayer.setData({data: hmp, max : heatmap.max});

	//map.addLayer(heatmapLayer);

	// hmp.forEach(function(m){
	//     L.marker(m).bindPopup("<pre>" + JSON.stringify(m, null, 2) + "</pre>").addTo(map);
	//})

	var markers = {
	    min : 100000,
	    max : 700000,
	    getValue : heatmap.getValue,
	    getPosition : heatmap.getPosition,
	    generatePoint : heatmap.generatePoint,
	    generatePoints : heatmap.generatePoints,

	    types : {
			user : L.AwesomeMarkers.icon({
	            prefix : "fa",
	            icon: "user",
	            markerColor: "black"
	        }),
	        home : L.AwesomeMarkers.icon({
	            prefix : "fa",
	            icon: "home",
	            markerColor: "orange"
	        }),
	        shop : L.AwesomeMarkers.icon({
	            prefix : "fa",
	            icon: "shopping-cart",
	            markerColor: "green"
	        }),
	        resturant : L.AwesomeMarkers.icon({
	            prefix : "fa",
	            icon: "cutlery",
	            markerColor: "blue"
	        }),
	        bus : L.AwesomeMarkers.icon({
	            prefix : "fa",
	            icon: "bus",
	            markerColor: "red"
	        })
	    }
	};

	var marks_home = markers.generatePoints(300).forEach(function(m){
	    return L.marker(m, {icon : markers.types.home}).bindPopup((function(){
	        return "Current owner: Stephen Redbridge<br>" +
	            "Asking price: " + m.value.toLocaleString("en-gb", { currency : "GBP", currencyDisplay : "symbol", style : "currency" });
	    })())//.addTo(map);
	});

	function convertToGoogleLatLng(bounds){
	    return {
	        east : bounds.getEast(),
	        west : bounds.getWest(),
	        north : bounds.getNorth(),
	        south : bounds.getSouth()
	    };
	}

	function convertGoogleLocationToLatLng(loc){
	    return [loc.lat(), loc.lng()];
	}

	var nService = new google.maps.places.PlacesService(document.createElement("div"));


	function abc(){
	    var request = {
	        bounds : convertToGoogleLatLng(map.getBounds()),
	        types : ['restaurant']
	    };
	    nService.nearbySearch(request, function(res){
	        console.log(res);
	        res.forEach(function(a){
	            var l = a.geometry.location;
	            L.marker(convertGoogleLocationToLatLng(l), {icon : markers.types.resturant}).bindPopup("<strong>" + a.name + "</strong>").addTo(map);
	        });
	    })
	}

	map.on('moveend', function(){
	    abc();
	});

	abc();
});

/*

var marks_shop = markers.generatePoints(30).forEach(function(m){
    return L.marker(m, {icon : markers.types.shop}).bindPopup((function(){
        return "Greg Bright's Convinence Store";
    })()).addTo(map);
});

var marks_resturant = markers.generatePoints(20).forEach(function(m){
    return L.marker(m, {icon : markers.types.resturant}).bindPopup((function(){
        return "Cafe Paradise";
    })()).addTo(map);
});

var marks_bus = markers.generatePoints(30).forEach(function(m){
    return L.marker(m, {icon : markers.types.bus}).bindPopup((function(){
        return "Bus Stop";
    })()).addTo(map);
});

*/
