# Dependencies
`lighttpd`

# Installation
## Project
`projectLocation/{service,worker}/ $ npm install`

## Lighttpd config 
`{projectLocation}/webapp/lighttpd.conf`

replace 
`server.username`
`server.groupname`
with your username

# Run
`# lighttpd -f {projectLocation}/webapp/lighttpd.conf`

`{projectLocation}/ $ node run.js`

[localhost webapp](http://localhost)

# Configuration
`{projectLocation}/{service,worker}/config.json`

[Database administration](http://adminer.vokracko.cz/?server=31.31.77.215&username=psidi&db=psidi&select=cell) (pw: psidi)