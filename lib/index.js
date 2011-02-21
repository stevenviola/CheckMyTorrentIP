var passkeys = new Array();

window.onload = function initPage() {
	$("<link rel='stylesheet' href='http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/themes/base/jquery-ui.css' type='text/css' media='all' />").appendTo('head');
	$("<div id='header'></div>").appendTo('#main');
	getIP();
	renderAddTorrent();
	renderLookup();
	renderTableHeader();
	renderSettings();
	getPasskeys();
	setInterval(getPasskeys, 45000);
	
	/* console.log(btapp.settings.set("bind_port",28115)); //Port used for incoming connections
	console.log(btapp.settings.set("upnp",true)); // Enable UPnP port mapping
	console.log(btapp.settings.set("natpmp",true)); //Enable NAT-PMP port mapping
	console.log(btapp.settings.set("rand_port_on_start",true)); // Randomize port each start
	console.log(btapp.settings.set("disable_fw",true)); //Add Windows Firewall execption
	
	console.log(btapp.settings.set("proxy.type",2)); //Type: 1 = Socks4, 2 = Socks5, 3 = HTTPS, 4 = HTTP
	console.log(btapp.settings.set("proxy.proxy","Hello WOrld")); //Proxy
	console.log(btapp.settings.set("proxy.port",6666)); // Port
	console.log(btapp.settings.set("proxy.auth",true)); //Authentication
	console.log(btapp.settings.set("proxy.username","Hello")); //Username
	console.log(btapp.settings.set("proxy.password","World")); //Password
	console.log(btapp.settings.set("proxy.resolve",true));//Use proxy for hostname lookups
	console.log(btapp.settings.set("proxy.p2p",true));//Use proxy for peer-to-peer connections
	
	
	console.log(btapp.settings.set("no_local_dns",true));//Disable all local DNS lookups
	console.log(btapp.settings.set("private_ip",true));//Disable features that leak identifying information
	console.log(btapp.settings.set("only_proxied_conns",true));//Disable connections unsupported by the proxy */
	
	$("#dialog-form").dialog({
			autoOpen: false,
			height: 300,
			width: 350,
			modal: true,
			buttons: {
				"Save": function() {
					console.log(document.settings.disable_fw.value);
					
					btapp.settings.set("bind_port",document.settings.bind_port.value); //Port used for incoming connections
					btapp.settings.set("upnp",Boolean(document.settings.upnp.value)); //Enable UPnP port mapping
					btapp.settings.set("natpmp",Boolean(document.settings.natpmp.value)); //Enable NAT-PMP port mapping
					btapp.settings.set("rand_port_on_start",Boolean(document.settings.rand_port_on_start.value)); // Randomize port each start
					btapp.settings.set("disable_fw",Boolean(document.settings.disable_fw.value)); //Add Windows Firewall execption
				
					btapp.settings.set("proxy.type",Number(document.settings.type.value)); //Type
					btapp.settings.set("proxy.proxy",document.settings.proxy.value); //Proxy
					btapp.settings.set("proxy.port",document.settings.port.value); // Port
					btapp.settings.set("proxy.username",document.settings.username.value); //Username
					btapp.settings.set("proxy.password",document.settings.password.value); //Password
					
					
					$("#dialog-form").dialog('close');
					
				},
				"Cancel": function(ev, ui) {
					$("#dialog-form").dialog('close');
				}
			},
			close: function() {
				$("#dialog-form").close();
			}
		});
	
}

function checkIP(passkey) {
	$.ajax({
		type: "GET",
		cache: false,
		url: "http://www.checkmytorrentip.com/torrenttrack.php?track=2&passkey="+passkey,
		dataType: "text",
		success: function(track) {
			//console.log("http://www.checkmytorrentip.com/torrenttrack.php?track=2&passkey="+passkey);
			var patt2 = new RegExp("</tr><tr><td>(.*)</td><td>(.*)</td><td>(.*)</td><td>(.*)</td><td><a href.*>(.*)</td></tr>","gi");
			var info = patt2.exec(track);				
			$("#track table tbody #row_"+passkey).empty();
			$("<td>"+info[1]+"</td><td>"+info[2]+"</td><td>"+info[3]+"</td><td>"+info[4]+"</td><td>"+info[5]+"</td><td>"+passkey+"</td><td><button id='del_"+passkey+"'type='button' >Delete</button></td>").appendTo("#track table tbody #row_"+passkey);
			
			$("#del_"+passkey).click(function() {
				//console.log("Remove Clicked");
				$.ajax({
					type: "GET",
					url: "http://www.checkmytorrentip.com/torrenttrack.php?track=2&deleteIp=all&passkey="+passkey,
					dataType: "text",
					success: function() {
						//console.log("Sucess");
						$("#row_"+passkey).remove();
						//console.log("Row Should be Gone");
						removePasskey(passkey);
					}
				});
			});
		}
	});
}

function addNewTorrent () {
	//Remove all the other CheckMyTorrentIP torrents
	var keys = btapp.torrent.keys();
	for (var i=0; i<keys.length; i++) {
		var my_torrent = btapp.torrent.get(keys[i]);
		my_torrent.remove();
	}
	
	var passkey;
	//Download a new torrent and extract the passkey
	bt.add.torrent('http://www.checkmytorrentip.com/torrenttrack.php?userGenerateTorrent=1', function(resp) {
		var hash = resp.hash;
		var my_torrent = btapp.torrent.get(hash);
		var trackers = my_torrent.properties.get("trackers");
		var patt = new RegExp(".*passkey=(.*)","gi");
		passkey = patt.exec(trackers[0]);
		$("<tr id='row_"+passkey[1]+"'><td></td><td></td><td></td><td></td><td></td><td>"+passkey[1]+"</td><td><button id='del_"+passkey[1]+"'type='button' >Delete</button></td></tr>").appendTo("#track table tbody");
		passkeys.push(passkey[1]);
		btapp.stash.set("data", JSON.stringify(passkeys));
		window.setTimeout(function() {
			checkIP(passkey[1]);
		}, 5000);
	});
}

function renderAddTorrent() {
	$("<button id='addNewTorrent' type='button' >Check My Torrent IP</button>").appendTo("#main");
	$("#addNewTorrent").click(function() {
		addNewTorrent();
	});
}

function renderTableHeader() {
	$("#main").append("<div id='track'></div>");
	$("<table><thead><tr><th>IP address</th><th>Last Seen (GMT)</th><th>UDP</th><th>User agent</th><th>Country</th><th>Passkey</th><th>Delete</th></tr></thead><tbody></tbody></table>").appendTo("#track");
}

function renderLookup() {
	$("<form id='searchPasskey' name='srcPasskey'></form>").appendTo('#main');
	$("#searchPasskey").append("<input type='text' name='search' value='Search Passkey' id='searchInput'/>");
	$("#searchInput").focus(function() {
		if (this.value=='Search Passkey') {
			this.value = '';
		}
	}).blur(function() {
		if( !this.value.length ) {
			this.value = 'Search Passkey';
		}
	});
	$("#searchPasskey").submit(function() {
		console.log(document.srcPasskey.search.value)
		checkIP(document.srcPasskey.search.value);
		return false;
	});
}

function getPasskeys() {
	passkeys = [];
	$("#track table tbody").empty();
	$.each(bt.stash.get("data"), function (i) {
		$("<tr id='row_"+this+"'><td></td><td></td><td></td><td></td><td></td><td>"+this+"</td><td><button id='del_"+this+"'type='button' >Delete</button></td></tr>").appendTo("#track table tbody");
		passkeys.push(this);
		btapp.stash.set("data", JSON.stringify(passkeys));
		checkIP(this);
	});
	btapp.stash.set("data", "");
	btapp.stash.set("data", JSON.stringify(passkeys));
}

function removePasskey(passkey) {
	passkeys = jQuery.grep(passkeys, function(value) {
		return value != passkey;
	});
	btapp.stash.set("data", JSON.stringify(passkeys));
	//console.log(passkeys);
}

function getIP() {
	$.ajax({
		type: "GET",
		url: "http://ip-address.domaintools.com/myip.xml",
		dataType: "xml",
		success: function(ip) {
			$(ip).find('dnstools').each(function(){
				var ip = $(this).find('ip_address').text();
				var hostname = $(this).find('hostname').text();
				var city = $(this).find('city').text();
				var region = $(this).find('region').text();
				var country = $(this).find('country').text();
				$("<h1><center>"+ip+"</center></h1>").appendTo('#header');
				$("<h2><center>"+hostname+"</center></h2>").appendTo('#header');
				$("<h3><center>"+city+", "+region+", "+country+"</center></h3>").appendTo('#header');
			});
		}
	});
}

function renderSettings() {
	$("<button id='change-settings'>Change uTorrent Proxy Settings</button>").appendTo('#main');
	$("#change-settings").click(function() {
			$("#dialog-form").dialog("open");
	});
	$("<div id='dialog-form' title='uTorrent Proxy Settings'><form id='settings' name='settings'></form></div>").appendTo('body');
	$("<fieldset id='fs1'></fieldset>").appendTo('#settings');
	$("<fieldset id='fs2'></fieldset>").appendTo('#settings');
	$("<fieldset id='fs3'></fieldset>").appendTo('#settings');
	
	$("<label for='proxy'>Port used for incoming connections: </label><input type='text' name='bind_port' id='bind_port' value='"+btapp.settings.get("bind_port")+"' class='text ui-widget-content ui-corner-all' /><br/>").appendTo('#fs1');
	$("<label for='proxy'>Enambe UPnP port mapping: </label><input type='checkbox' name='upnp' id='upnp' value='"+Boolean(btapp.settings.get("upnp"))+"' class='checkbox ui-widget-content ui-corner-all' /><br/>").appendTo('#fs1');
	$("<label for='proxy'>Enable NAT-PMP port mapping: </label><input type='checkbox' name='natpmp' id='natpmp' value='"+Boolean(btapp.settings.get("natpmp"))+"' class='checkbox ui-widget-content ui-corner-all' /><br/>").appendTo('#fs1');
	$("<label for='proxy'>Randomize port each start: </label><input type='checkbox' name='rand_port_on_start' id='rand_port_on_start' value='"+Boolean(btapp.settings.get("rand_port_on_start"))+"' class='checkbox ui-widget-content ui-corner-all' /><br/>").appendTo('#fs1');
	$("<label for='proxy'>Add Windows Firewall exception: </label><input type='checkbox' name='disable_fw' id='disable_fw' value='"+Boolean(btapp.settings.get("disable_fw"))+"' class='checkbox ui-widget-content ui-corner-all' /><br/>").appendTo('#fs1');
	
	$("<label for='proxy'>Type: </label><select id='type' name='type'><option value=0>(none)</option><option value=1>Socks4</option><option value=2>Socks5</option><option value=3>HTTPS</option><option value=4>HTTP</option></select><br/>").appendTo('#fs2');
	$("<label for='proxy'>Proxy: </label><input type='text' name='proxy' id='proxy' value='"+btapp.settings.get("proxy.proxy")+"' class='text ui-widget-content ui-corner-all' /><br/>").appendTo('#fs2');
	$("<label for='port'>Port: </label><input type='text' name='port' id='port' value='"+btapp.settings.get("proxy.port")+"' class='text ui-widget-content ui-corner-all' /><br/>").appendTo('#fs2');
	$("<label for='username'>Username: </label><input type='text' name='username' id='username' value='"+btapp.settings.get("proxy.username")+"' class='text ui-widget-content ui-corner-all' /><br/>").appendTo('#fs2');
	$("<label for='password'>Password: </label><input type='password' name='password' id='password' value='"+btapp.settings.get("proxy.password")+"' class='text ui-widget-content ui-corner-all' /><br/>").appendTo('#fs2');
}
