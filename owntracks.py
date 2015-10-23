import os
import paho.mqtt.client as mqtt
import datetime
import json
import math

# Requires the paho mqtt client. Can be installed using PIP.

# {
    # "_type": "waypoint",
    # "desc": "Paris is lovely",
    # "lat": "48.858330",
    # "lon": "2.295130",
    # "rad": "50",
    # "tst": "1385997757"
# }

waypoints =  []

def in_range(report):
	if "desc" in report:
		return report
	radius = 10000
	selected_point = {}
	selected_point ["desc"] = "lost"
	for point in waypoints:
		print "checking range for waypoint " + point ["desc"]
		# print "latitude for this point is ", report['lat']
		distance = distance_on_unit_sphere (float (point ['lat']), float(point ['lon']), float(report ['lat']), float(report ['lon']))
		print "distance is ", distance
		if distance < float (point["rad"]) and float (point["rad"]) <radius:
			radius = float (point ["rad"])
			selected_point = point
	report ["desc"] = selected_point ["desc"]
	report ["event"] = "enter"
	print "Adding description and event to location report for waypoint ", report
	
	return report
	
def distance_on_unit_sphere(lat1, long1, lat2, long2):

    # Convert latitude and longitude to 
    # spherical coordinates in radians.
    degrees_to_radians = math.pi/180.0
        
    # phi = 90 - latitude
    phi1 = (90.0 - lat1)*degrees_to_radians
    phi2 = (90.0 - lat2)*degrees_to_radians
        
    # theta = longitude
    theta1 = long1*degrees_to_radians
    theta2 = long2*degrees_to_radians
        
    # Compute spherical distance from spherical coordinates.
        
    # For two locations in spherical coordinates 
    # (1, theta, phi) and (1, theta, phi)
    # cosine( arc length ) = 
    #    sin phi sin phi' cos(theta-theta') + cos phi cos phi'
    # distance = rho * arc length
    
    cos = (math.sin(phi1)*math.sin(phi2)*math.cos(theta1 - theta2) + 
           math.cos(phi1)*math.cos(phi2))
    arc = math.acos( cos )

    # Remember to multiply arc by the radius of the earth 
    # in your favorite set of units to get length.
    return arc*6373*1000


def save_waypoints():
	waypoints_file = open ("waypoints.txt", "w")
	for point in waypoints:
		waypoints_file.write(json.dumps(point).encode('utf-8') + "\n")
	waypoints_file.close()
	
def load_waypoints():
	global waypoints
	waypoints = []
	if not os.path.exists("waypoints.txt"):
		print "Failed to load waypoints"
		return
	with open ("waypoints.txt", "r") as input:
		for line in input:
			waypoints.append (json.loads (line))
		print "Loaded waypoints!"
	
	

current = {}
current_raw = {}
output = open ("owntracks_history.txt",'a')
# The callback for when the client receives a CONNACK response from the server.
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))

    # Subscribing in on_connect() means that if we lose the connection and
    # reconnect then subscriptions will be renewed.
    client.subscribe("owntracks/#")

# The callback for when a PUBLISH message is received from the server.
def on_message(client, userdata, msg):
	print(msg.topic+" "+str(msg.payload))	
	if len(msg.payload) >0:
		decoded = json.loads(msg.payload)
		if decoded["_type"] == "waypoint":
			print "Reloading waypoints"
			load_waypoints()
			root, user, device, type = msg.topic.split('/')
			print "detected waypoint"
			decoded["owner"] = user
			waypoints.append (decoded)
			save_waypoints()
		
		
		if decoded['_type'] == "location":
			root, user, device = msg.topic.split('/')
			print "Reloading waypoints"
			load_waypoints()
			# Adds waypoint to the incoming message if a match is found.
			decoded = in_range(decoded)
			if "event" in decoded:
				current[user] = decoded
				current_raw[msg.topic] = decoded
				#create_page()
				dump_raw ()
			time = datetime.datetime.fromtimestamp(int(decoded ['tst'])).strftime('%Y-%m-%d %H:%M:%S')
			output.write (time + "| " +msg.topic + " | " +json.dumps(decoded).encode('utf-8') + "\n")
			output.flush ()
	

def create_page():		
	page = open ("current.html",'w')
	page.write (""" <html xmlns="http://www.w3.org/1999/xhtml">    
  <head>      
    <title>Locations</title>      
    <meta http-equiv="refresh" content="60" />    
  </head>    
  <body>\n""")
	for user, details in current.items ():
		location = details['desc'].encode('utf-8')
		event = details['event']
		battery = "0"
		if 'batt' in details:
			battery = details ['batt']
		
			
		time = datetime.datetime.fromtimestamp(
        int(details ['tst'])
		).strftime('%Y-%m-%d %H:%M:%S')
		page.write (time + " - " + user + " has " + event + " " + location.encode ('utf-8') + " with battery " + battery +"<br>\n")
	page.write (" </body></HTML>")
	page.close()
		
def dump_raw():		
	page = open ("current_raw.html",'w')
	for user, details in current_raw.items ():
		page.write (user + " | " + json.dumps(details).encode('utf-8') + "\n")
	page.close()

load_waypoints()
print waypoints		
client = mqtt.Client( protocol=mqtt.MQTTv31)
client.on_connect = on_connect
client.on_message = on_message
print "trying to connect..."
client.connect("localhost", port=1883)

# Blocking call that processes network traffic, dispatches callbacks and
# handles reconnecting.
# Other loop*() functions are available that give a threaded interface and a
# manual interface.
client.loop_forever()
