# Dependencies
`lighttpd`
`node > 7.2`

browser with ECMAScript 6 and above

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