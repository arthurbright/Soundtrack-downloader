require('dotenv').config();

const ytdl = require('ytdl-core');
const https = require('https');
const apiKey = process.env.KEY;
const fs = require('fs');
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const archiver = require('archiver');

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

app.post("/songs", async (req, res)=>{
    let songs = req.body.paragraph.split("\r\n");
    id += 1;
    let curId = id; //store a local copy because this function is async

    //create folder to store playlist
    if(!fs.existsSync('./public/storage/' + curId)){
        fs.mkdirSync('./public/storage/' + curId);
    }

    for(let i = 0; i < songs.length; i ++){
        //get each song file
        
        let status = await getSongFile(songs[i], curId);
        if(status == 1){
            console.log("downloaded " + songs[i]);
        }
    }
    
    //after downloading is done, zip it and send
    const output = fs.createWriteStream(__dirname + '/public/storage/playlist' + curId + '.zip');
    const archive = archiver('zip');

    output.on('close', ()=>{
        console.log('done zipping!');
        res.sendFile(path.join(__dirname, '/public/storage/playlist' + curId + '.zip'));
        //todo delete files
    });

    archive.on('error', (err)=>{
        throw err;
    });

    archive.pipe(output);
    archive.directory('./public/storage/' + curId + "/", false);
    archive.finalize();

});







//searches song name on youtube
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
            console.log(data);
            if(data.items && data.items.length != 0){
                let finalUrl = 'https://www.youtube.com/watch?v=' + data.items[0].id.videoId;
                let name = data.items[0].snippet.title;
                callback({url: finalUrl, name: name});
            }
            else{
                callback({url: 0});
            }
            
        })
    })

    
}

//retrieves song file
function getSongFile(searchStr, folderId){
    let promise = new Promise((res, rej)=>{
        getUrl(searchStr, (ress)=>{ //res: {url, name}
            if(ress.url == 0){
                rej("video not found");
                return;
            }
            //trim ress.name of illegal characters
            let trimmed = ress.name.split("|").join('');
            trimmed = trimmed.split('/').join('');
            trimmed = trimmed.split('&quot;').join('');
            ytdl(ress.url, {filter: "audioonly"}).pipe(fs.createWriteStream('./public/storage/' + folderId + "/" + trimmed + '.mp3')).on("close", ()=>{
                res(1);
            });

        });
    });
    return promise;
    
}

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log("Listening on port " + PORT));
