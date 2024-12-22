textbox = document.getElementById("vidurl")

function handleClick(){
    url = textbox.value.trim()
    if (url.length == 0){
        return;
    }
    
    window.location.href = "/download?url=" + encodeURIComponent(url);
}
