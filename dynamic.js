$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURIComponent(results[1]) || 0;
    }
}


/* Configuration starts here */
//The places array is the list of the places to be displayed on the clock. Each place is defined by its own list. The first entry in this list is the name displayed on the clock, and optional subsequent entries are synonyms that can be used for matching waypoint names.
var colours = "red, blue, green, orange, black, purple, fuchsia, maroon, navy, olive, teal, silver, teal, gray, yellow, lime".split(", ");
var static_places = [["Forsvunnet", "lost"], ["Holt"],  ["Leirsund", "Marianne"],  ["Tunneltoppen"],  ["Butikken", "store","butikk"],["Mortal peril", "mortal", "peril"], ["Jobb", "work"], ["Skole", "school"]];//, ["Trener", "endomondo"], ["Kjører", "driving"]];
var prepopulated_places = [["Butikken", "store","butikk"],["Mortal peril", "mortal", "peril"], ["Jobb", "work"], ["Skole", "school"],["Holt"],  ["Leirsund", "Marianne"],  ["Tunneltoppen"]];
var dynamic_places = [];
var offset_count = 1;
var hand_length = 250;
var clock_radius = 220;
var maximum_places = get_maximum_sectors (8);

var maximum_dynamic_places = maximum_places;
var data_file = "current_raw.html";
var current = {};
var user_count = 0;
configuration = {}
//A user configuration can be either specified manually as below, or automatically when new users are detected from the input data file.
//configuration ["kolaf"] = new user_configuration ("red");
//configuration ["villemy"] = new user_configuration ("purple");
/* Configuration ends here */

$.ajaxSetup({ cache: false });
var canvas;
var context;
var first_time = true;
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

function get_maximum_sectors(fallback) {
	var user_string =$.urlParam("sectors");
	// console.log (user_string);
	if (user_string) {
		return parseInt (user_string);
	}
	return fallback;
}


function reset_sector_count() {
	for (var i in dynamic_places) {
		dynamic_places[i].number_occupied = 0;
	}
}


function sector (number) {
	return sector_size*number - sector_start;
}
function user_configuration (name,colour) {
	this.colour = colour;
	this.name = name;
	this.width = 5+parseInt(Math.random() *10, 10);
	this.offset = offset_count;
	offset_count = offset_count +1;
	this.position = 0;
	this.sector_position = 0;
	this.sector = 0;
	this.current_position = 0;
	this.speed=1;
	this.real = true;
}	

function ClockPlace(name, synonyms) {
	this.name = name;
	this.synonyms = synonyms;
	this.number_occupied = 1;
	this.added = Date.now();
	this.add_user  = function () {
		this.added = Date.now ();
		this.number_occupied = this.number_occupied +1;
		return this;
	}
}	

function remove_oldest_places() {
	while (dynamic_places.length>maximum_places) {
		console.log ("removing places...");
		var smallest_index = 0;
		var earliest_time = Date.now()+1000;
		for  (var i in dynamic_places) {
			if (dynamic_places[i].added<earliest_time) {
				earliest_time = dynamic_places[i].added;
				smallest_index =i;
			}
		}
		console.log ("smallest  index is  " + smallest_index);
		for (var user in  configuration ) {
			if (configuration [user].sector==smallest_index) {
				console.log ("  Removing user " + user + " ffrom sector  " +  smallest_index);
				configuration [user].sector = 0;
				configuration[user].real = false;
				
			}
			if (configuration [user].sector >smallest_index) {
				configuration [user].sector--;
			}
		}
		dynamic_places.splice (smallest_index, 1);
	}
}	
	
function draw_face() {
	context.clearRect(-canvas.width/2, -canvas.height/2, canvas.width, canvas.height);
	var index = 0;
	var places = dynamic_places;//static_places.concat (dynamic_places);
	for(index in places) {
		context.save();
		context.translate(0, 0);
		context.rotate(degreesToRadians ( index*360/places.length + 0.5*360/places.length));
		context.translate (clock_radius, 0);
		context.fillText(places [index].name, -3, 0);
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

function getRandomColour() {
	return colours.shift();
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
	configuration [user] = new user_configuration(user,getRandomColour ());
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
	var keys =Object.keys(current).sort();
	for 	(k in keys) {
		var  user =keys [k];
		var user_object = configuration[user];
		user_object.position = calculate_position (user);
		var target =user_object.position;
		//console.log ("current user is " + user + " current position is " + user_object.current_position + " target position is " +  target);
		if (Math.round (user_object.current_position)!= Math.round (user_object.position)) {
			var dist=getShortAngle(user_object.current_position, target);
//			console.log("User "+ current[user] +" dist is "+dist);
			if ((target - user_object.current_position + 360) % 360 < 180){
				user_object.current_position = user_object.current_position +0.9+dist/180;
			} else {
				user_object.current_position = user_object.current_position -0.9-dist/180;				
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
		setTimeout(function() { animate();}, 80);
	}
	
}

function getShortAngle(a1, a2)

{

    var angle = (Math.abs(a1 - a2))%360;

	

    if(angle > 180)

        angle = 360 - angle;

		

    return angle;

};

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
	if (get_user (user).real) {
		context.beginPath();
		context.moveTo(0,0); // center
		context.lineTo(-10,thickness *-1);
		context.lineTo( size * 1,0);
		context.lineTo(-10,thickness);
		context.lineTo(0,0);
		//context.fill();
		context.stroke();
	}
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

function  set_positions (lines, add) {
	reset_sector_count();
	$.each (lines, function () {
	if (this.length >10) {
		var line = this.split (" | ");		
		var user = line[0].split("/") [1];
		if (check_user_display (user)) {
			var location =JSON.parse(line[1]);
			current[user] = location;
			var user_object = get_user (user);
			user_object.sector = get_sector(user, add);
			
			user_object.sector_position =dynamic_places[user_object.sector].number_occupied;
			// console.log ("User " + user + " as sector " + user_object.sector + " with sector possession " + user_object.sector_position);
		}
	}
  });
}

function get_data(){
  
  $.get(data_file,function(data,status){
  lines = data.split ("\n");
  console.log (data);
  user_count = lines.length;
  if (visible_users.length >0) {
	user_count = visible_users.length;
  }
  set_positions (lines, true);
  remove_oldest_places();
  console.log (dynamic_places);
  animate();
	
  });
  }
  
function initialise_places () {
	dynamic_places [0] =new ClockPlace ("Forsvunnet",["Forsvunnet", "lost"]);
	for(var index  = 0; index < maximum_places- prepopulated_places.length-1; index++) {
		dynamic_places.push (new  ClockPlace("...........",["..........."]));
	}
	for(var index  = 0; index < prepopulated_places.length; index++) {
		if (dynamic_places.length >= maximum_places) {
			return;
		}
		dynamic_places.push (new ClockPlace(prepopulated_places [index][0],prepopulated_places [index]));
	}
}

function dump_places () {
	for (var place in dynamic_places) {
		console.log  (dynamic_places [place]);
	}
}
  
  
function calculate_position (user) {
	var user_object = get_user (user);
	// console.log  ("sector = " + user_object.sector);
	// console.log ("user " + user + " sector is " + user_object.sector + " sector_count = " + dynamic_places[user_object.sector].number_occupied+ " user sector position is " + user_object.sector_position);
	return (360/dynamic_places.length)*(user_object.sector_position)/(dynamic_places[user_object.sector].number_occupied+1) +user_object.sector*360/dynamic_places.length;
}
  
function get_sector (user, add) {
	get_user(user).real =  true;
	// dump_places ();
	var place = current [user] ["desc"];
	if (current [user] ["event"] == "enter" ) {
		for (var index in dynamic_places) {
			for(var synonym in dynamic_places [index].synonyms) {
				if (place.toLowerCase().indexOf (dynamic_places[index].synonyms[synonym].toLowerCase())>=0) {
					dynamic_places[index].add_user();
					// console.log ("Returning existing sector " + index);
					return  index;		
				}
			}
		}
		for (var index in static_places) {
			for(var synonyms in static_places [index]) {
				if (place.toLowerCase().indexOf (static_places[index][synonyms].toLowerCase())>=0) {
					dynamic_places.push (new ClockPlace (static_places [index][0],static_places [index][1]));
					// console.log ("returning new static sector " +  (dynamic_places.length -1));
					return  dynamic_places.length -1;		
				}
			}
		}
		var new_place = new ClockPlace(place,[place]);
		
		// console.log ("Adding new place "  + new_place);
		dynamic_places.push(new_place);
		return (dynamic_places.length-1)
	}
	return 0;
}


$(function(){
	canvas = document.getElementById('myCanvas');
	context = canvas.getContext('2d');
	initialise_places ();
	clockApp();
});		
	
$(document).ready( function(){
  		
  		//Get the canvas & context
  		var c = $('#myCanvas');
  		var ct = c.get(0).getContext('2d');
  		var container = $(c).parent();
  		
  		//Run function when browser  resize
	  	//$(window).resize( respondCanvas );
	  	
	  	function respondCanvas(){
  			c.attr('width', $(container).width() ); //max width
  			c.attr('height', $(container).height() ); //max height
  			
  			//Redraw & reposition content
  			createClock();
		}
		
		//Initial call
		//respondCanvas();
  	});	