The mqtt whereabouts clock consists of two pieces of software, a server component written in Python, and a graphical component in an XML file using Jquery, HTML 5 Canvas, and Ajax. Positions are provided using owntracks on one or more cell phones. It supports waypoint notifications directly from the app, as well as calculating waypoint range within the server in order to share waypoints between users without any extra manual setup.

An example page is available here: http://fallokken.kolaf.net:8080/static/clock_dynamic.html

The Python server requires the Paho mqtt library to be installed in order to communicate with the mqtt broker.

The script by default connects to a broker on localhost using port 1883. It listens to waypoint and location messages and produces four files:
waypoints.txt - a list of all registered waypoints, no filtering
current.html - a text version of the current use of position waypoint
current_raw.html - the latest raw owntracks location message for each user
owntracks_history.txt - a log of all position reports

Current limitations:
Has problems with special UTF-8 characters.