var map;
var restInfo = {};
var marker;

// Initialize maps, centered at Mexico
function myMap() {
	var mapProp = {
	    center:new google.maps.LatLng(19.4326,-99.1332),
	    zoom: 13,
	};
	map = new google.maps.Map(document.getElementById("googleMap"),mapProp);

	google.maps.event.addListener(map, 'click', function(event) {
    	setMarker(event.latLng, map);
    	markerLoc = event.latLng;
  	});
}

// Adds a marker to the map. Restrict to only 1 market at a time.
function setMarker(location, map) {
	$('#info').empty();
	$("#recommend").empty();
	if (marker) {
	  	getInfo(circle.getRadius(), marker.getPosition());
		marker.setPosition(location);
  	}
  	else {
	  	marker = new google.maps.Marker({
	    	position: location,
	    	map: map
	  	});

        // Define a circle and set its editable property to true.
       circle = new google.maps.Circle({
			map: map,
			radius: 500, // initial 
			fillColor: '#AA0000',
			editable: true // user can edit radius of circle
        });
	  	getInfo(circle.getRadius(), marker.getPosition());

	    circle.bindTo('center', marker, 'position');
	    google.maps.event.addListener(circle, 'radius_changed', function() {
			$('#info').empty();
			$("#recommend").empty();
	  		getInfo(circle.getRadius(), marker.getPosition());
	    });
  	}
}

function getInfo(radius, location) {
	var countOfRes = 0;
	var average = 0;
	var std = 0;
	var ratingTotal = 0;
	
	$.getJSON('/data/data_melp.json', function(data) { 
		var ratings = [data.length]
		for (i = 0; i < data.length; i++) {
			if (measure(location.lat(), location.lng(), parseFloat(data[i].address.location.lat), 
				parseFloat(data[i].address.location.lng)) <= radius) {
				ratings[countOfRes] = parseFloat(data[i].rating);
				ratingTotal += parseFloat(data[i].rating);
				++countOfRes;
			}
		}
		if (countOfRes > 0) {
			average = ratingTotal/countOfRes;
			for (j = 0; j < ratings.length; ++j) {
				std += (ratings[j] - average) * (ratings[j] - average);
			}
			std = Math.sqrt(std/ratings.length);
		}
		$('#info').append('<p class="first"><h2 id="information">Area Information</h2>');
		$('#info').append('<p id="count">Number of Restaurants in the Area (0-4): ' + countOfRes + '</p>');
		$('#info').append('<p id="average">Average Rating of Restaurants in the Area: ' + average + '</p>');	
		$('#info').append('<p id="std">Standard Deviations of Ratings of Restaurants in the Area: ' + std + '</p></p>');
	}); 

}

function recommend() {
	$("#recommend").empty();

	var min = document.getElementById("min").value;
	var max = document.getElementById("max").value;
	var checked = false;
	var rating = 0;

	if ((min !== "") && (max != "") && (parseFloat(min) <= parseFloat(max)) && (markerLoc !== undefined) && 
				(parseFloat(min) <= 4) && parseFloat(max) <= 4) {
		checked = true;
		$("#recommend").append('<h2 id="reccTitle"> Restaurant Recommendations</h2>')
	}

    if (checked) {
		$.getJSON('/data/data_melp.json', function(data) {
			data.sort(function(a, b) {
				return a.rating - b.rating;
			});
			data.reverse();

			var str = "";

			var restInfo = [data.length]
			for (i = 0; i < data.length; i++) {
				if ((measure(markerLoc.lat(), markerLoc.lng(), 
					parseFloat(data[i].address.location.lat), 
					parseFloat(data[i].address.location.lng)) <= circle.getRadius()) &&
					(data[i].rating >= parseFloat(min)) && (data[i].rating <= parseFloat(max))) {
					str = str.concat('<p class="restRecc"><h3>'+ data[i].name +'</h3>');
					str = str.concat('<table><tr></tr><tr><th>Location:</th><td>'+ 
							data[i].address.street +'</td></tr><tr><td></td><td>' + data[i].address.city +
							'</td></tr><tr><td></td><td>'+ data[i].address.state +'</td></tr><tr><th>Rating:</th><td>' +
							data[i].rating + '</td></tr><tr><th>Website:</th><td>'+ data[i].contact.site + '</td></tr><tr>' +
							'<th>Email:</th><td>' + data[i].contact.email + '</td></tr><tr><th>Phone:</th><td>' +
							data[i].contact.phone + '</td></tr></table></p>');
					str = str.concat('<div class="fb-like" data-href="' + data[i].contact.site +'" data-layout="standard" data-action="like" data-size="small" data-show-faces="true" data-share="true"></div>');
				}
			}
			$("#recommend").append(str);	
			FB.XFBML.parse(document.getElementById('recommend'));
		});

	}
}

function measure(lat1, lon1, lat2, lon2){  // generally used geo measurement function
    var R = 6378.137; // Radius of earth in KM
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}