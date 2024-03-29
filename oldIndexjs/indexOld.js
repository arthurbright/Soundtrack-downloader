//require('dotenv').config();

const ytdl = require('ytdl-core');
const https = require('https');
const apiKey = 'AIzaSyD' + 'xdDzdBsjewG' + 'AJB0m6kYWNV6ByXjc9yd' + 'I';
const fs = require('fs');
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const archiver = require('archiver');
const ytsr = require('ytsr');
const Spotify = require('spotify-web-api-node');

//initialize app
const app = express();

//set static folder
app.use("/", express.static(path.join(__dirname, 'public')));
//json decoding
app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));

//initialize spotify client
const spotifyClient = new Spotify({
    clientId: '2f8e7031be82498b843166a287dba04e',
    clientSecret: '89aabbbe28704d7' + 'd96b0943e' + '60f8f5ba'
});
spotifyClient.clientCredentialsGrant().then((data)=>{
    // Save the access token so that it's used in future calls
    spotifyClient.setAccessToken(data.body['access_token']);
}, (err)=>{
    console.log('Error retrieving access token', err);
})


//debug apis
app.post("/test", (req, res)=>{
    getSongFile("revenge minecraft", ()=>{
        res.sendFile(path.join(__dirname, "/public/test.mp3"));
    });
});
app.get("/debug", (req, res)=>{
    spotifyClient.getPlaylist('3kJyzqpKHQTyJ1blyxsO4D').then( (data)=>{
        console.log(data.body.tracks.items[0].track.name);
        res.send('this is debug page');
    }, (err)=>{
        console.log('Error retrieving spotify playlist!');
        console.log(err);
    })
});

//download songs. each download package will have a unique id and a folder with that id;
//the folder will be zipped and sent and then deleted.
let id = 0;

app.post("/songs", async (req, res)=>{
    let songs = req.body.paragraph.split("\r\n");
    id += 1;
    let curId = id; //store a local copy because this function is async

    //create folder to store playlist
    if(!fs.existsSync(__dirname + '/public/storage/' + curId)){
        fs.mkdirSync(__dirname + '/public/storage/' + curId);
    }

    for(let i = 0; i < songs.length; i ++){
        //get each song file
        if(songs[i].length < 3) continue;
        let status = await getSongFile(songs[i], curId);
        if(status == 1){
            console.log("downloaded " + songs[i]);
        }
    }
    /*
    //after downloading is done, zip it and send
    const output = fs.createWriteStream(__dirname + '/public/storage/playlist' + curId + '.zip');
    const archive = archiver('zip');

    //after zipping is done
    output.on('close', ()=>{
        
        res.download(path.join(__dirname, '/public/storage/playlist' + curId + '.zip'), 'myPlaylist.zip', (err)=>{
            if(err){
                console.log("error in sending file");
            }
            else{
                //delete files
                fs.unlinkSync(path.join(__dirname, '/public/storage/playlist' + curId + '.zip'));
                fs.rmdirSync(path.join(__dirname, '/public/storage/' + curId), { recursive: true });
            }
        });
    });


    //additional zipping code
    archive.on('error', (err)=>{
        throw err;
    });

    archive.pipe(output);
    archive.directory('./public/storage/' + curId + "/", false);
    archive.finalize();
    */
});

app.post("/spotifysongs", async (req, res)=>{
    console.log('NEW PLAYLIST BEING CONSTRUCTED*******************************')
    console.log(Date.now());


    let link = req.body.spotifyLink;
    id += 1;
    let curId = id; //store a local copy because this function is async

    //create folder to store playlist
    if(!fs.existsSync(__dirname + '/public/storage/' + curId)){
        fs.mkdirSync(__dirname + '/public/storage/' + curId);
    }

    //only get the playlist ID from the entire playlist URL
    let playlistId = link.split('/playlist/')[1];

    //retrieve playlist
    let data = await spotifyClient.getPlaylist(playlistId);
    //download songs
    for(let i = 0; i < data.body.tracks.items.length; i ++){
        //get each song file
        console.log('>> started downloading ' + data.body.tracks.items[i].track.name);
       
        let status = await getSongFile(data.body.tracks.items[i].track.name + " " + data.body.tracks.items[i].track.artists[0].name , curId);
        if(status == 1){
            console.log(">> downloaded " + data.body.tracks.items[i].track.name);
        }
        else if(status == 0){
            i -= 1;
            console.log('***YTDL timed out. Retrying...')
        }
        else if(status == 2){
            console.log('***403 miniget error. Retrying...');
        }
       
    }

    //
    
    /*
    //after downloading is done, zip it and send
    const output = fs.createWriteStream(__dirname + '/public/storage/playlist' + curId + '.zip');
    const archive = archiver('zip');

    //after zipping is done
    output.on('close', ()=>{
        
        res.download(path.join(__dirname, '/public/storage/playlist' + curId + '.zip'), 'myPlaylist.zip', (err)=>{
            if(err){
                console.log("error in sending file");
            }
            else{
                //delete files
                fs.unlinkSync(path.join(__dirname, '/public/storage/playlist' + curId + '.zip'));
                fs.rmdirSync(path.join(__dirname, '/public/storage/' + curId), { recursive: true });
            }
        });
        
    });


    //additional zipping code
    archive.on('error', (err)=>{
        throw err;
    });

    archive.pipe(output);
    archive.directory('./public/storage/' + curId + "/", false);
    archive.finalize();
    */
});

app.get('/download', (req, res) =>{
    res.send('hi');
});





//searches song name on youtube (ratelimited)
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

//unlimited string to url function
async function getUrl2(str, callback){

    console.log('GETURL TIME');
    let filters = await ytsr.getFilters(str);
    let filter = filters.get('Type').get('Video');
    
    let res = await ytsr(filter.url, {limit: '1'});
    if(res.items.length > 0){
        callback({url: res.items[0].url, name: res.items[0].title});
        //console.log(res.items[0].url);
    }
    else{
        callback({url: 0});
    }
    
}

//retrieves song file
function getSongFile(searchStr, folderId){
    let promise = new Promise((res, rej)=>{
        getUrl2(searchStr, (ress)=>{ //res: {url, name}
            if(ress.url == 0){
                rej("video not found");
                return;
            }
            //trim ress.name of illegal characters
            let trimmed = ress.name.split("|").join('');
            trimmed = trimmed.split('/').join('');
            trimmed = trimmed.split('&quot;').join('');
            trimmed = trimmed.split("(").join('');
            trimmed = trimmed.split(")").join('');
            trimmed = trimmed.split("'").join('');
            trimmed = trimmed.split('"').join('');
            trimmed = trimmed.split('?').join('');
           
            try{
                console.log('YTDL TIME');
                ytdl(ress.url, {filter: "audioonly"}).pipe(fs.createWriteStream('./public/storage/' + folderId + "/" + trimmed + '.mp3')).on("close", ()=>{
                    res(1);
                });
            }catch(err){
                res(2);
            }
            

            //timeout and retry if over 9 seconds
            let timer = new Promise((resolve, reject) => {
                setTimeout(() => {
                  resolve('timeout');
                }, 15000);
            });
            timer.then((val)=>{
                res(0);
            })
            

        });
    });
    return promise;
    
}

const PORT = process.env.PORT || 3000
app.listen(PORT, ()=> console.log("Listening on port " + PORT));
