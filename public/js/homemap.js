$(function() {
	//background map
	var map = L.map('homemap', { zoomControl:false,attributionControl:false });
	map.setView([51.505, -0.09], 13);
	map.dragging.disable();
	map.touchZoom.disable();
	map.doubleClickZoom.disable();
	map.scrollWheelZoom.disable();
	map.keyboard.disable();
	L.tileLayer('http://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
		maxZoom: 18
	}).addTo(map);

	//auto
	var input = document.getElementById('location_input');
	var lat_input = $('#location_lat_input');
	var lng_input = $('#location_lng_input');
	var form = $('#location_form');

	var options = {};

	var autocomplete = new google.maps.places.Autocomplete(input, options);

	google.maps.event.addListener(autocomplete, 'place_changed', function(){
		autocomplete.getPlace();
		var place = autocomplete.getPlace();
		var location = place.geometry.location;

		var lat = place.geometry.location.lat();
		var lng = place.geometry.location.lng();

		lat_input.val(lat);
		lng_input.val(lng);

		map.setView([lat, lng], 13);
	});
});
