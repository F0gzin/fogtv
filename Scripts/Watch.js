const params = Object.fromEntries(new URLSearchParams(window.location.search));
const showId = params["s"];
const episodeParam = params["e"];

const playerVideoDiv = document.getElementById("PlayerVideoParent");
const playerVideoTitle = document.getElementById("PlayerAreaTitle");
const fullScreenButton = document.getElementById("FullScreenButton");

let seasonId;
let episodeId;
let episodeData;

const prevButton = document.getElementById("PrevEpisodeButton");
const nextButton = document.getElementById("NextEpisodeButton");

const cleanURL = window.location.origin + window.location.pathname;

function loadFileSync(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false); 
    xhr.send(null);

    if (xhr.status === 200) {
        return xhr.responseText;
    } else {
        throw new Error("Couldn't load file: "+String(url));
    }
}

function LoadJsonFile(filePath){
    const fileRawData = loadFileSync(filePath);
    const fileAsObject = JSON.parse(fileRawData);
    
    return fileAsObject;
}

const episodeButtonTemplate = loadFileSync("../Data/EpisodeButton.html");

const showsData = LoadJsonFile("../Data/ShowsData.json");
const thisShowData = showsData[showId];

if(thisShowData){
    resolveEpisodeId(episodeParam);
    loadShowEpisode(showId);
    loadShowEpisodesPreview();
}else{
    window.alert(`Unknown show: "${showId}"`);
    document.body.remove();
}

const defaultState = playerVideoDiv.style;
console.log(defaultState);
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            alert(`FULLSCREEN ERROR: ${err.message} (${err.name})`);
        });
        playerVideoDiv.style="position:fixed;width:100%;height:100vh;left:0px;top:0px";
        playerVideoDiv.style.zIndex = 5;
        body.style.overflowY = "hidden";
    }else{
        document.exitFullscreen();
        //playerVideoDiv.style=defaultState;
        //playerVideoDiv.style.height = "480px";
        //body.style.overflowY = "scroll";
    }
}

document.addEventListener("fullscreenchange", (e)=>{
    if (document.fullscreenElement) {
        console.log('entered fullscreen');
    } else {
        console.log('exited fullscreen');
        playerVideoDiv.style=defaultState;
        playerVideoDiv.style.height = "480px";
        playerVideoDiv.style.display = "block";
        body.style.overflowY = "scroll";
    }
});


fullScreenButton.onclick = toggleFullScreen;

function resolveEpisodeId(episodeStr){
    if(episodeStr === "$first" || episodeStr === "$1st" || episodeStr === undefined){
        seasonId = 0;
        episodeId = 0;
        console.log("Episode:", episodeId, "; Season:", seasonId);
        return;
    }

    const parts = episodeStr.split("_");
    if(parts.length < 1){
        return;
    }else{
        if(parts[1]){ // has two parts ex 1-2
            seasonId = Number(parts[0])-1;
            episodeId = Number(parts[1])-1;
        }else{
            seasonId = null;
            episodeId = Number(parts[0])-1;
        }
    }

    console.log("Episode:", episodeId, "; Season:", seasonId);
}

function loadShowEpisode(){
    episodeData = thisShowData.seasons[seasonId].episodes[episodeId];
    console.log("Episode data:", episodeData);
    
    let videoSourceUrl = episodeData.url_embed;

    if(episodeData.host_type === "youtube"){
        playerVideoDiv.innerHTML = `<iframe width="100%" height="100%" src="${videoSourceUrl}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`;
    }else if(episodeData.host_type === "googledrive"){
        playerVideoDiv.innerHTML = `<iframe id="PlayerVideo" src="${videoSourceUrl}" width="100%" height="100%"></iframe>`;
    }else if(episodeData.host_type === "rawfile"){
        playerVideoDiv.innerHTML = `<video id="PlayerVideo" width="100%" height="100%" controls><source src="${videoSourceUrl}" type="video/mp4"></video>`;
    }else{
        window.alert(`Unknown host: "${episodeData.host_type}"`);
    }

    //playerVideoTitle.innerHTML = `${thisShowData.display_name}: <i>${episodeData.name || "(episódio sem nome)"} - ${("Episódio " + String(episodeId+1))}</i>`;
    if(episodeData.name){
        playerVideoTitle.innerHTML = `${thisShowData.display_name}: <i>${episodeData.name || "(episódio sem nome)"} - ${("Episódio " + String(episodeId+1))}</i>`;
    }else{
        playerVideoTitle.innerHTML = `${thisShowData.display_name}: <i>${("Episódio " + String(seasonId+1) + "-" + String(episodeId+1))}</i>`;
    }
    document.title = `${seasonId+1}-${episodeId+1} - ${thisShowData.display_name}`;
}

function loadShowEpisodesPreview(){
    const episodeListDiv = document.getElementById("EpisodesListA");
    
    for(let i=0; i<thisShowData.seasons.length; i++){
        // for each season
        const newLabel = document.createElement("h3");
        const ss = thisShowData.seasons[i];
        newLabel.innerText = `Temporada ${String(i+1)}:`;
        
        if(ss.type === "specials"){
            newLabel.innerText = "Especiais:";
        }else if(ss.type === "movie"){
            newLabel.innerText = "Filme:";
        }

        episodeListDiv.appendChild(newLabel);

        for(let j=0; j<ss.episodes.length; j++){
            const newLabelA = document.createElement("div");
            const ep = ss.episodes[j];
            let Url = cleanURL + "?s="+showId+"&e="+`${i+1}_${j+1}`;
            let ThumbUrl = "";
            if(ep.cover){
                ThumbUrl = ep.cover;
            }else{
                ThumbUrl = "../Assets/ShowsThumb/"+showId+".png";
            }
            let processed = episodeButtonTemplate
            .replaceAll("$HREF$",Url)
            .replaceAll("$EPISODE_ID%",`${i+1} - ${j+1}`)
            .replaceAll("$EPISODE_NAME%",ep.name || "Ep") 
            .replaceAll("$EPISODE_INFO%","Jan. 1st 1970")
            .replaceAll("$THUMBNAIL_URL$",ThumbUrl);

            if(i === seasonId && j === episodeId){
                processed = processed.replaceAll("$STYLE$","background-color: #1f3ea7; width:100%; height:100%;");
            }else{
                processed = processed.replaceAll("$STYLE$","width:100%; height:100%;");
            }
            
            newLabelA.innerHTML = processed;
            episodeListDiv.appendChild(newLabelA);
        }
    }
}

function episodeToString(increase){
    let EpNumber = episodeId;
    let SeasonNumber = seasonId;

    const seasonData = thisShowData.seasons[seasonId];

    EpNumber += increase;

    if(EpNumber < 0){
        SeasonNumber--;
    }else if(EpNumber >= seasonData.episodes.length){
        EpNumber = 0;
        SeasonNumber++;
    }

    if(SeasonNumber < 0){
        window.alert("Nothing to go back to.");
        return [false, "1_1"];
    }

    if(SeasonNumber >= thisShowData.seasons.length){
        window.alert("It's over bro, nothing's more");
        return [false, "1_1"];
    }

    return [true, `${SeasonNumber+1}_${EpNumber+1}`];
}

prevButton.onclick = function(){
    const [success, s] = episodeToString(-1);
    if(success){
        window.location.assign(`${cleanURL}?s=${showId}&e=${s}`);
    }
}

nextButton.onclick = function(){
    const [success, s] = episodeToString(+1);
    if(success){
        window.location.assign(`${cleanURL}?s=${showId}&e=${s}`);
    }
}