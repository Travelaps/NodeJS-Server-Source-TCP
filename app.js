//pm2 start app.js -o /dev/null -e /dev/null --name Vectron --max-memory-restart 200M --restart-delay 100 -- CS=2 CE=3 NM=Vectron PORT=52275
//pm2 start app.js -o /dev/null -e /dev/null --name 3CX --max-memory-restart 200M --restart-delay 100 -- CS=2 CE=3 NM=3CX PORT=62275 CX=1
//pm2 start app.js -o /dev/null -e /dev/null --name Salto --max-memory-restart 200M --restart-delay 100 -- CS=2 CE=3 NM=Salto PORT=42275 CX=1


var net = require('net');
const request = require('request');
exports.conf = {
	CS: 0,//Starting Character
	CE: 0,//Ending Character
	NM: 0,//Name of the ApiSequence
	PORT: 0,//Port to Listen On
	CX:0,//Wether to greet client with ACK+LS|
	AUTH:0,//LoginToken to be forwarded 
	TIMEOUT:0
};
exports.proxyHeaders = {
	
};

for (var i = 0; i < process.argv.length; i++){
	var arg = process.argv[i];
	var key = arg.split('=')[0];
	var val = arg.split('=').pop();
	if(exports.conf[key] === 0)
		exports.conf[ key ] = val;
}
if(exports.conf["AUTH"] !== 0)
	exports.proxyHeaders["authorization"] = "Bearer " + exports.conf["AUTH"];
if(exports.conf["TIMEOUT"] === 0)
	exports.conf["TIMEOUT"] = 15000;//DEFAULT 15 seconds
else
	exports.conf["TIMEOUT"] = exports.conf["TIMEOUT"] * 1000;

console.log(exports.conf);		

process.on('uncaughtException', function (error) {
    if (error != null)
        console.log("UE:" + (error || "").toString() );
});

var server = net.createServer((socket)=>{
	var buffers = [];
	var ip = socket.remoteAddress;
	if(ip > ''){
		ip = ip.split(',')[0];
		ip = ip.split(':').filter(f=> f.indexOf('.') > 0)[0];
	}
	var killtime = setTimeout( ()=>{ socket.destroy(); console.log("Conection ("+ip+") killed by server") } ,exports.conf["TIMEOUT"]);
	
	
	console.log( ip + " initiated connection" );
	//SEND ACK
	if(exports.conf.CX != 0){
		socket.write(Buffer.from([6]));
		socket.write(Buffer.from([exports.conf.CS]));
		socket.write(Buffer.from("LS|DA200512|TI170501|"));
		socket.write(Buffer.from([exports.conf.CE]));	
	}
	
	socket.on('data', function(chunk){
		clearTimeout(killtime);
		killtime = setTimeout( ()=>{ socket.destroy(); console.log("Conection ("+ip+") killed by server") } ,exports.conf["TIMEOUT"]);
		
		//New request from this client has started..
		if(chunk[0]==exports.conf.CS)
			buffers = [];
		//New data chunk to cache
		buffers.push(chunk);
		//Client has finished sending us all data
		if(chunk[chunk.length-1]==exports.conf.CE)
		{
			var fullBuffer = Buffer.concat(buffers);
			var fullText = Buffer.from(fullBuffer).toString('utf8');
			fullText = fullText.substring( 1,fullText.length - 1 );
			console.log( ip + " sent " + fullText );

			//Send Request To Webservice(with 1sec delay..)
			setTimeout(()=>{
				request({
					rejectUnauthorized: false,
					url: "https://4001.hoteladvisor.net/apisequence/"+exports.conf.NM+"?IP="+ip,
					method: "POST",
					body: fullText,
					headers: exports.proxyHeaders
				}, (err, response, responseBody) => {
					if(responseBody != null && responseBody.toString() > ''){
						socket.write(Buffer.from([exports.conf.CS]));
						socket.write(responseBody);
						console.log( ip + " was replied with "+responseBody );
						socket.write(Buffer.from([exports.conf.CE]));
					}					
				});	
			},1000);
		}
	});
});
server.listen(exports.conf.PORT);