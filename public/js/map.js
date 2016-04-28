$(function() {
	"use strict";
	/** Util functions **/
	function convertToGoogleLatLng(bounds){
		return {
			east : bounds.getEast(),
			west : bounds.getWest(),
			north : bounds.getNorth(),
			south : bounds.getSouth()
		};
	}

	function convertGoogleLocationToLatLng(loc){
		return L.latLng(loc.lat(), loc.lng());
	}

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


	var lat = 50.93519;
	var lng = -1.39571; //[ 52.18935168521872, -2.2124576568603516 ],
	var zoom = 15;

	var map = new L.map("map", {
		// Default centre and zoom
		center : [ lat, lng ],
		zoom : zoom
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



	//location input panel
	var input = $('#location_input').first(),
		location = input.val().trim();

	var form    = $('#location_form').first();
	var list    = $('#location_list').first();

	var autocomplete = new google.maps.places.Autocomplete(input[0], {}),
		geocoder = new google.maps.Geocoder();


	if(location && location !== ""){
		geocoder.geocode({ address : location }, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				var loc = results[0].geometry.location;
				map.setView(convertGoogleLocationToLatLng(loc), zoom);
			}
		});
	}

	google.maps.event.addListener(autocomplete, 'place_changed', function(){

	});

	form.submit(function(){
		location = input.val();
		if(location && location != ""){
			geocoder.geocode({ address : location }, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var loc = results[0];

					var newloc =    $('<li>'+
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
					L.marker(convertGoogleLocationToLatLng(loc.geometry.location), {icon : markerSettings.user}).bindPopup("<strong>" + loc.formatted_address + "</strong>").addTo(map);
				}
			});
		}
		input.val("");
		input.focus();
		return false;
	});





	/*** Heatmap generation ***/
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




	// AwesomeMarker settings for the markers
	var markerSettings = {
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
		restaurant : L.AwesomeMarkers.icon({
			prefix : "fa",
			icon: "cutlery",
			markerColor: "blue"
		}),
		bus : L.AwesomeMarkers.icon({
			prefix : "fa",
			icon: "bus",
			markerColor: "red"
		}),

		user : L.AwesomeMarkers.icon({
			prefix : "fa",
			icon: "user",
			markerColor: "black"
		}),

		school : L.AwesomeMarkers.icon({
			prefix : "fa",
			icon: "graduation-cap",
			markerColor: "green"
		}),
		doctor :  L.AwesomeMarkers.icon({
			prefix : "fa",
			icon: "user-md",
			markerColor: "darkgreen"
		}),
		convenience_store : L.AwesomeMarkers.icon({
			prefix : "fa",
			icon: "shopping-cart",
			markerColor: "orange"
		})

		
	};

	var filterElement = document.querySelector("#sidebar-layers>div");


	var nService = new google.maps.places.PlacesService(document.createElement("div"));

	var allPoiIds = [];

	var poiTypes = [
		"restaurant",
		"school",
		"doctor",
		"convenience_store"
	];

	var poiBaseLayer = L.layerGroup().addTo(map),
		poiLayers = {};
		// Populate the layers, one for each POI type
		poiTypes.forEach(function(t){
			poiLayers[t] = L.layerGroup().addTo(poiBaseLayer);
		});

	// Add filter buttons
	poiTypes.forEach(function(type){
		var layer = poiLayers[type],
			p = document.createElement("p");
		
		var span = document.createElement("span"), 
			i = document.createElement("i");

		var faName = markerSettings[type].options.icon;
		i.className = "fa fa-" + faName;
		span.appendChild(i);
		span.appendChild(document.createTextNode(" " + type + ": "));
		
		var inp = document.createElement("input");
		inp.type = "checkbox";
		inp.checked = "true";
		inp.addEventListener("change", function(){
			if(this.checked){
				poiBaseLayer.addLayer(layer);
			}else{
				poiBaseLayer.removeLayer(layer);
			}
		});

		p.appendChild(span);
		p.appendChild(inp);

		filterElement.appendChild(p);
	});


	function getGooglePois(){
		var bounds = convertToGoogleLatLng(map.getBounds()),
			purgeMarkers = false;
		
		// If the number of markers is too large, purge them and start again
		// So we don't explode memory usage
		if(allPoiIds.length > 1000){
			allPoiIds = [];
		} 


		poiTypes.forEach(function(type){
			var iconSettings = { icon : markerSettings[type] },
				layer = poiLayers[type];

			if(purgeMarkers){
				layer.clearLayers();
			}

			var request = {
				bounds : bounds,
				type : type
			};

			nService.nearbySearch(request, function(results){
				console.log(results);
				if(results){
					results.forEach(function(result){
						// Don't duplicate markers
						if(allPoiIds.indexOf(result.id) < 0){
							allPoiIds.push(result.id);
							var l = result.geometry.location;


							L.marker(convertGoogleLocationToLatLng(l), iconSettings)
								.bindPopup("<strong>" + result.name + "</strong><br>" + type)
								.addTo(layer);
						}
					});
				}
			});
		});
	}

	map.on('moveend', function(){
		getGooglePois();
	});

	getGooglePois();




	/*** Generate random housing markers ***/
	var markers = {
		min : 100000,
		max : 700000,
		getValue : heatmap.getValue,
		getPosition : heatmap.getPosition,
		generatePoint : heatmap.generatePoint,
		generatePoints : heatmap.generatePoints,
	};

	var marks_home = markers.generatePoints(300).forEach(function(m){
		return L.marker(m, {icon : markerSettings.home}).bindPopup((function(){
			return "Current owner: Stephen Redbridge<br>" +
				"Asking price: " + m.value.toLocaleString("en-gb", { currency : "GBP", currencyDisplay : "symbol", style : "currency" });
		})())//.addTo(map);
	});


});

/*

var marks_shop = markers.generatePoints(30).forEach(function(m){
	return L.marker(m, {icon : markerSettings.shop}).bindPopup((function(){
		return "Greg Bright's Convinence Store";
	})()).addTo(map);
});

var marks_resturant = markers.generatePoints(20).forEach(function(m){
	return L.marker(m, {icon : markerSettings.resturant}).bindPopup((function(){
		return "Cafe Paradise";
	})()).addTo(map);
});

var marks_bus = markers.generatePoints(30).forEach(function(m){
	return L.marker(m, {icon : markerSettings.bus}).bindPopup((function(){
		return "Bus Stop";
	})()).addTo(map);
});

*/
