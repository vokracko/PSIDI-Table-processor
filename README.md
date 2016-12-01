# Dependencies
`lighttpd`

# Installation
## Project
`projectLocation/{service,worker}/ $ npm install`

## Lighttpd config 
`/etc/lighttpd/lighttpd.conf`

<pre>
server.port	= 80
server.username	= "**{$USER}**"
server.groupname = "**{$USER}**"
server.document-root = "**{projectLocation}/webapp/**"
server.errorlog	= "/var/log/lighttpd/error.log"
dir-listing.activate = "enable"
index-file.names = ( "index.html" )
mimetype.assign	= (
				".html" => "text/html",
				".txt" => "text/plain",
				".css" => "text/css",
				".js" => "application/x-javascript",
				".jpg" => "image/jpeg",
				".jpeg" => "image/jpeg",
				".gif" => "image/gif",
				".png" => "image/png",
				"" => "application/octet-stream"
			)
server.modules = (
	"mod_access",
	"mod_accesslog",
)
accesslog.filename = "/var/log/lighttpd/access.log"
setenv.add-response-header = ( "Access-Control-Allow-Origin" => "*" )
</pre>

# Run
`# lighttpd -D -f /etc/lighttpd/lighttpd.conf &`

`{projectLocation}/ $ node run.js`

[localhost webapp](http://localhost)

# Configuration
`{projectLocation}/{service,worker}/config.json`

[Database administration](http://adminer.vokracko.cz/?server=31.31.77.215&username=psidi&db=psidi&select=cell) (pw: psidi)