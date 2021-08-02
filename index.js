require('dotenv').config();

const ytdl = require('ytdl-core');
const https = require('https');
const apiKey = process.env.KEY;
const fs = require('fs');
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');

//initialize app
const app = express();

//set static folder
app.use("/", express.static(path.join(__dirname, 'public')));
//json decoding
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

//debug thing
app.post("/test", (req, res)=>{
    getSongFile("revenge minecraft", ()=>{
        res.sendFile(path.join(__dirname, "/public/test.mp3"));
    });
});

//download songs. each download package will have a unique id and a folder with that id;
//the folder will be zipped and sent and then deleted.
let id = 0;

app.post("/songs", (req, res)=>{
    let songs = req.body.paragraph.split("\r\n");
    console.log(songs);
    res.send("hi");
});








function getUrl(str, callback){
    let url = 'https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q='
    url = url + str + "&type=video&key=" + apiKey;

    let resStr = "";
    https.get(url, (res)=>{
        res.on('data', (chunk) =>{
            resStr += chunk;
        });
        res.on('end', ()=>{
            //data finished sending
            let data = JSON.parse(resStr);
            if(data.items && data.items.length != 0){
                let finalUrl = 'https://www.youtube.com/watch?v=' + data.items[0].id.videoId;
                callback(finalUrl);
            }
            else{
                callback(0);
            }
            
        })
    })

    
}

function getSongFile(searchStr, callback){
    getUrl(searchStr, (url)=>{
        ytdl(url, {filter: "audioonly"}).pipe(fs.createWriteStream('./public/test.mp3')).on("close", ()=>{
            callback('test.mp3');
        });

    });
}

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log("Listening on port " + PORT));
