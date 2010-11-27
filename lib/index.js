var passkeys = new Array();

window.onload = function initPage() {
	$("<div id='header'></div>").appendTo('#main');
	getIP();
	renderAddTorrent();
	renderLookup();
	renderTableHeader();
	getPasskeys();
	setInterval(getPasskeys, 45000);
}

function checkIP(passkey) {
	$.ajax({
		type: "GET",
		cache: false,
		url: "http://www.checkmytorrentip.com/torrenttrack.php?track=2&passkey="+passkey,
		dataType: "text",
		success: function(track) {
			console.log("http://www.checkmytorrentip.com/torrenttrack.php?track=2&passkey="+passkey);
			var patt2 = new RegExp("</tr><tr><td>(.*)</td><td>(.*)</td><td>(.*)</td><td>(.*)</td><td><a href.*>(.*)</td></tr>","gi");
			var info = patt2.exec(track);				
			$("#track table tbody #row_"+passkey).empty();
			$("<td>"+info[1]+"</td><td>"+info[2]+"</td><td>"+info[3]+"</td><td>"+info[4]+"</td><td>"+info[5]+"</td><td>"+passkey+"</td><td><button id='del_"+passkey+"'type='button' >Delete</button></td>").appendTo("#track table tbody #row_"+passkey);
			
			$("#del_"+passkey).click(function() {
				console.log("Remove Clicked");
				$.ajax({
					type: "GET",
					url: "http://www.checkmytorrentip.com/torrenttrack.php?track=2&deleteIp=all&passkey="+passkey,
					dataType: "text",
					success: function() {
						console.log("Sucess");
						$("#row_"+passkey).remove();
						console.log("Row Should be Gone");
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
	for (var i=0; i<passkeys.length; i++) {
		if (passkeys[i] == passkey) {
			passkeys = passkeys.splice(i+1,1);
		}
	}
	btapp.stash.set("data", JSON.stringify(passkeys));
	console.log(passkeys);
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
