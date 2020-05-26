# TalyaTcpToHttp
1. Install NodeJS
apt install nodejs
2. Install npm
apt install npm 
2. Install pm2
npm install pm2 -g
3. Start related service to your needs
```
pm2 start app.js -o /dev/null -e /dev/null --name Vectron --max-memory-restart 200M --restart-delay 100 -- CS=2 CE=3 NM=Vectron PORT=52275 LT=18892#oguz$*****
pm2 start app.js -o /dev/null -e /dev/null --name 3CX --max-memory-restart 200M --restart-delay 100 -- CS=2 CE=3 NM=3CX PORT=62275 CX=1
pm2 start app.js -o /dev/null -e /dev/null --name Salto --max-memory-restart 200M --restart-delay 100 -- CS=2 CE=3 NM=Salto PORT=42275 CX=1
```
4. pm2 save
