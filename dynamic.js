/* Configuration starts here */
//The places array is the list of the places to be displayed on the clock. Each place is defined by its own list. The first entry in this list is the name displayed on the clock, and optional subsequent entries are synonyms that can be used for matching waypoint names.
var static_places = [["Forsvunnet", "lost"], ["Holt"],  ["Leirsund", "Marianne"],  ["Tunneltoppen"],  ["Butikken", "store","butikk"],["Mortal peril", "mortal", "peril"], ["Jobb", "work"], ["Skole", "school"]];//, ["Trener", "endomondo"], ["Kjører", "driving"]];
var dynamic_places = [];
var offset_count = 1;
var hand_length = 250;
var clock_radius = 220;
var maximum_places = 12;
var maximum_dynamic_places = maximum_places- static_places.length;
var data_file = "current_raw.html";
var current = {};
var user_count = 0;
var sector_count = new Array(maximum_places);
configuration = {}
//A user configuration can be either specified manually as below, or automatically when new users are detected from the input data file.
configuration ["kolaf"] = new user_configuration ("red");
configuration ["villemy"] = new user_configuration ("purple");
/* Configuration ends here */

$.ajaxSetup({ cache: false });
var canvas;
var context;
$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURIComponent(results[1]) || 0;
    }
}
var visible_users = get_visible_users();

function check_user_display (user) {
	if (visible_users.length == 0) {
		return true;
	}
	return  $.inArray(user, visible_users) > -1;
}

function get_visible_users() {
	var user_string =$.urlParam("users");
	if (user_string) {
		var return_list = user_string.split(",");
		return return_list;
	}
	return [];
}


function reset_sector_count() {
	for (var i= 0;i <maximum_places;i++) {
		sector_count[i] = 0;
	}
}


function sector (number) {
	return sector_size*number - sector_start;
}
function user_configuration (colour) {
	this.colour = colour;
	this.width = 5+parseInt(Math.random() *10, 10);
	this.offset = offset_count;
	offset_count = offset_count +1;
	this.position = 0;
	this.sector = 0;
	this.sector_position = 0;
	this.current_position = 0;
}	
	
function draw_face() {
	context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
	var index = 0;
	var places = static_places.concat (dynamic_places);
	for(index in places) {
		context.save();
		context.translate(0, 0);
		context.rotate(degreesToRadians ( index*360/places.length + 0.5*360/places.length));
		context.translate (clock_radius, 0);
		context.fillText(places [index][0], -3, 0);
		context.restore();
		context.save();
		context.beginPath();
		context.translate(0, 0);
		
		context.rotate(degreesToRadians ( index*360/places.length));
		///context.translate(clock_radius, 0);
		 
		context.moveTo(0, 0);
		context.lineTo(clock_radius+100, 0);
		context.stroke();
		context.closePath();
		context.restore();
		index = index +1;
	}
}
	

function degreesToRadians(degrees) {
  return (Math.PI / 180) * degrees
}
function offset_size () {

	var places = static_places.concat (dynamic_places);
//	return Math.round(360/ (places.length*Object.keys (configuration).length +2));
	return Math.round(360/ (places.length*user_count +2));
}

function getRandomColour() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function get_user (user) {
	if (user in configuration) {
		return configuration [user];;
	}
	configuration [user] = new user_configuration(getRandomColour ());
	return configuration [user];
}

function drawUserHand(user){
  context.save();
  context.fillStyle = 'black';
  context.strokeStyle = '#555';
  context.rotate( degreesToRadians(configuration [user].current_position));
  drawHand(configuration[user].colour,hand_length, configuration[user].width, 5, user);	
  context.restore();
}


function animate (user) {
//	addBackgroundImage ();
	draw_face();
	var animated = false;
	for 	(user in current) {
		var user_object = configuration [user];
		user_object.position = calculate_position (user);
		var target =Math.round (user_object.position);
		//console.log ("current user is " + user + " current position is " + user_object.current_position + " target position is " +  target);
		if (user_object.current_position!= Math.round (user_object.position)) {
			if ((target - user_object.current_position + 360) % 360 < 180){
				user_object.current_position = user_object.current_position +1;
			} else {
				user_object.current_position = user_object.current_position -1;				
			}
			user_object.current_position = user_object.current_position % 360;
			
			if (user_object.current_position >360) {
				user_object.current_position= 0;
			}
			if (user_object.current_position <0) {
				user_object.current_position = 360;
			}
			
			animated = true;
			//console.log ("animating");
		}
		drawUserHand(user);
	}
	if (animated) {
		setTimeout(function() { animate();}, 100);
	}
	
}

function drawHand(colour,size, thickness, shadowOffset, user){
	thickness = thickness || 4;
	context.shadowColor = '#555';
	context.shadowBlur = 10;
	context.shadowOffsetX = shadowOffset;
	context.shadowOffsetY = shadowOffset;
	context.fillStyle = colour;
	context.globalAlpha = 0.5;
	context.strokeStyle =  colour;
	var text_size = context.measureText  (user);
	context.fillText(user, (size - text_size.width)/2,10);
	context.beginPath();
	context.moveTo(0,0); // center
	context.lineTo(-10,thickness *-1);
	context.lineTo( size * 1,0);
	context.lineTo(-10,thickness);
	context.lineTo(0,0);
	//context.fill();
	context.stroke();
}

function createClock(){

  
  get_data();

  
}

function clockApp(){
  context.translate(canvas.width/2, canvas.height/2);
  context.font = "25pt Helvetica";
  createClock();
  setInterval('createClock()', 30000)
}


function get_data(){
  reset_sector_count();
  $.get(data_file,function(data,status){
  lines = data.split ("\n");
  console.log (data);
  user_count = lines.length;
  if (visible_users.length >0) {
	user_count = visible_users.length;
  }
  $.each (lines, function () {
	if (this.length >10) {
		var line = this.split (" | ");		
		var user = line[0].split("/") [1];
		if (check_user_display (user)) {
			var location =JSON.parse(line[1]);
			current[user] = location;
			var user_object = get_user (user);
			user_object.position =get_degrees (user)+ user_object.offset*offset_size ();
			user_object.sector = get_sector(user);
			
			sector_count [user_object.sector]=sector_count [user_object.sector] +1;
			user_object.sector_position =sector_count [user_object.sector];
			
			if (user_object.position <0) {
				user_object.position = user_object.position +360;
			}
		}
	}
  });
    
	animate();
  
  });
  }
  

function calculate_position (user) {
	var user_object = get_user (user);
	var places = static_places.concat (dynamic_places);
	//console.log ("user " + user + " sector is " + user_object.sector + " sector_count = " + sector_count [user_object.sector]+ " user sector position is " + user_object.sector_position);
	return (360/places.length)*(user_object.sector_position)/(sector_count [user_object.sector]+1) +user_object.sector*360/places.length;
}
  
function get_sector (user) {
	var places = static_places.concat(dynamic_places);
	var place = current [user] ["desc"];
	if (current [user] ["event"] == "enter" ) {
		for (var index in places) {
			for(var synonyms in places [index]) {
				if (place.toLowerCase().indexOf (places[index][synonyms].toLowerCase())>=0) {
					return  index;				}
			}
		}
		var new_place = [place];
		dynamic_places.push(new_place);
		if (dynamic_places.length > maximum_dynamic_places) {
			dynamic_places.shift();
		}
		places = static_places.concat(dynamic_places);
		return (places.length-1)
	}
	return 0;
}


function get_degrees (user) {
	var places = static_places.concat(dynamic_places);
	var place = current [user] ["desc"];
	if (current [user] ["event"] == "enter" ) {
		for (var index in places) {
			for(var synonyms in places [index]) {
				if (place.toLowerCase().indexOf (places[index][synonyms].toLowerCase())>=0) {
					return  index*360/places.length;
				}
			}
		}
		var new_place = [place];
		dynamic_places.push(new_place);
		if (dynamic_places.length > maximum_dynamic_places) {
			dynamic_places.shift();
		}
		places = static_places.concat(dynamic_places);
		return (places.length-1)*360/(places.length);
	}
	return 0;
	
}	
		

$(function(){
	canvas = document.getElementById('myCanvas');
	context = canvas.getContext('2d');
	clockApp();
});		
	
  
