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

	// A function to convert an object from lnglat to an array
	function llToGeoJsonArray(i){
	    return [i.lng, i.lat];
	}
	// Function to get a geojson coordinate array from bounds
	function convertBounds(bounds){
	    return [
	        llToGeoJsonArray(bounds.getNorthEast()),
	        llToGeoJsonArray(bounds.getNorthWest()),
	        llToGeoJsonArray(bounds.getSouthWest()),
	        llToGeoJsonArray(bounds.getSouthEast()),
	        llToGeoJsonArray(bounds.getNorthEast())
	    ];
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

	function formatTypes(types){
		if(types instanceof Array){
			types = types.join(', ');
		}
		return types.replace(/_/g, ' ');
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

	var form	= $('#location_form').first();
	var list	= $('#location_list').first();

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

	var userPlacesLayer = L.layerGroup().addTo(map);
	var userPlaces = {};
	var generateUserLocations = function(){
		userPlacesLayer.clearLayers();
		for(var p in userPlaces){
			var loc = userPlaces[p];
			L.marker([loc.lat, loc.lng], {icon : markerSettings.user})
				.bindPopup('<span class="popup-name">' + loc.address + '</span><span class="popup-type">custom location, '+formatTypes(loc.types)+'<span>')
				.addTo(userPlacesLayer);
		}
	}

	function addUserPlace(address, lat, lng, types){
		if(!userPlaces[address]){
			userPlaces[address] = {
				address : address,
				lat : lat,
				lng : lng,
				types : types
			};

			var newloc =	$('<li data-location="'+address+'">'+
							'<span class="place" data-lat="'+lat+'" data-lng="'+lng+'"><i class="fa fa-map-marker fa-fw"></i> '+address+'</span>'+
							'<span class="remove"><i class="fa fa-ban fa-fw"></i></span>'+
							'</li>');

			newloc.find(".place").click(function(){
				map.setView([$(this).data("lat"), $(this).data("lng")], 16);
			});

			newloc.find(".remove .fa").click(function(){
				var item = $(this).parent().parent();
				delete userPlaces[item.data("location")];
				item.remove();
				//update displayed places
				generateUserLocations();
			});

			list.append(newloc);


			generateUserLocations();
		}

	}


	function geocodeUserPlace(location){
		if(location && location != ""){
			geocoder.geocode({ address : location }, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var loc = results[0];
					addUserPlace(loc.formatted_address, loc.geometry.location.lat(), loc.geometry.location.lng(), loc.types);
				}
			});
		}
	}


	form.submit(function(e){
		e.preventDefault();
		location = input.val();
		geocodeUserPlace(location);

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


	//heatmapLayer.setData({data: hmp, max : heatmap.max});

	map.addLayer(heatmapLayer);

	// hmp.forEach(function(m){
	//     L.marker(m).bindPopup("<pre>" + JSON.stringify(m, null, 2) + "</pre>").addTo(map);
	//})




	// AwesomeMarker settings for the markers
	var markerSettings = {
		home : L.AwesomeMarkers.icon({
			prefix : "fa",
			icon: "home",
			markerColor: "purple"
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

	var filterElement = $("#sidebar-filter");


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
			container = $(
				'<div class="input-container">'+
				'<label for="'+type+'_checkbox">'+type+'</label>'+
				'<div class="icon"><i class="fa fa-'+markerSettings[type].options.icon+'"></i></div>'+
				'</div>'),
			checkbox = $('<input id="'+type+'_checkbox" type="checkbox" checked>');

		checkbox.on("change", function(){
			if($(this).is(':checked')){
				poiBaseLayer.addLayer(layer);
			}else{
				poiBaseLayer.removeLayer(layer);
			}
		});

		container.prepend(checkbox);
		filterElement.append(container);
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
				//console.log(results);
				if(results){
					results.forEach(function(result){
						// Don't duplicate markers
						if(allPoiIds.indexOf(result.id) < 0){
							allPoiIds.push(result.id);
							var l = result.geometry.location;

							var container = document.createElement("div");
							var text = '<span class="popup-name">' + result.name + '</span><span class="popup-type">' + formatTypes(type) + '</span><br>';
							var addToCustom = document.createElement("a");
								addToCustom.href = "#";
								addToCustom.addEventListener("click", function(e){
									e.preventDefault();
									addUserPlace(result.name, result.geometry.location.lat(), result.geometry.location.lng(), result.types);
								});
								addToCustom.innerHTML = "Add as custom place";

							container.innerHTML = text;
							container.appendChild(addToCustom);

							L.marker(convertGoogleLocationToLatLng(l), iconSettings)
								.bindPopup(container)
								.addTo(layer);
						}
					});
				}
			});
		});
	}


	function getPoliceData(){
		$.ajax({
			type : "POST",
			url : "/data/police",
			data : { bounds : JSON.stringify(convertBounds(map.getBounds())) },
			dataType : 'json',
			success : function(data){
				var dd = data.results.map(function(d){
					var coords = d.geom.coordinates;
					return { lat : coords[1], lng : coords[0] };
				});
				heatmapLayer.setData({data: dd, max : heatmap.max});
			}
		});
	}

	map.on('moveend', function(){
		getGooglePois();
		getPoliceData();
	});

	getGooglePois();
	getPoliceData();

	document.getElementById("heatmap_checkbox").addEventListener("change", function(){
		if(this.checked){
			map.addLayer(heatmapLayer);
		}else{
			map.removeLayer(heatmapLayer);
		}
	});



	/*** Generate random housing markers ***/
	var markers = {
		min : 100000,
		max : 700000,
		getValue : heatmap.getValue,
		getPosition : heatmap.getPosition,
		generatePoint : heatmap.generatePoint,
		generatePoints : heatmap.generatePoints,
	};

	
	var housingLayer = L.layerGroup().addTo(map);
	function generateHousingMarkers(){
		markers.generatePoints(50).forEach(function(m){
			return L.marker(m, {icon : markerSettings.home}).bindPopup(
				"Current owner: Stephen Redbridge<br>" +
				"Asking price: " + m.value.toLocaleString("en-gb", { currency : "GBP", currencyDisplay : "symbol", style : "currency" })
			).addTo(housingLayer);
		});
	}
	generateHousingMarkers();


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
