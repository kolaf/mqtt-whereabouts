<html>
<head>
	<title>Magic Mirror</title>
	<style type="text/css">
		<?php include('css/main.css') ?>
	</style>
	<link rel="stylesheet" type="text/css" href="css/weather-icons.css">
	<link href="logtail.css" rel="stylesheet" type="text/css">
	<script src="js/jquery.js"></script>
	<script type="text/javascript">
		var gitHash = '<?php echo trim(`git rev-parse HEAD`) ?>';
	</script>
    <script type="text/javascript" src="logtail.js"></script>

	<meta name="google" value="notranslate" />
	<meta http-equiv="Content-type" content="text/html; charset=utf-8" />
</head>
<body>

	<div class="top left"><div class="date small dimmed"></div><div class="time"></div><div class="calendar xxsmall"></div></div>
	<div class="top right"><div class="windsun small dimmed"></div><div class="temp"></div><div class="forecast small dimmed"></div></div>
	<div class="bottom-clock center-hor"><canvas id="myCanvas" width="600" height="600" style = "margin-left: auto; margin-right: auto; display: block;">
  Your browser does not support canvas
</canvas>
</div>
<div class="center-ver right xxsmall conversations"><pre id="data">Loading...</pre></div>
 	<div class="top center-hor"><div class="power medium"></div></div>
	<div class="bottom center-hor"><div class="news medium"></div></div>

</div>

<script src="js/jquery.js"></script>
<script src="js/jquery.feedToJSON.js"></script>
<script src="js/ical_parser.js"></script>
<script src="js/moment-with-langs.min.js"></script>
<script src="js/config.js"></script>
<script src="js/rrule.js"></script>
<script src="js/dynamic.js" type="text/javascript"></script>
<script src="js/main.js?nocache=<?php echo md5(microtime()) ?>"></script>
<!-- <script src="js/socket.io.min.js"></script> -->

</body>
</html>
