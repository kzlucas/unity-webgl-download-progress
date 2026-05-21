

var container = document.querySelector("#unity-container");
var canvas = document.querySelector("#unity-canvas");
var loadingBar = document.querySelector("#unity-loading-bar");
var warningBanner = document.querySelector("#unity-warning");

// Shows a temporary message banner/ribbon for a few seconds, or
// a permanent error message on top of the canvas if type=='error'.
// If type=='warning', a yellow highlight color is used.
// Modify or remove this function to customize the visually presented
// way that non-critical warnings and error messages are presented to the
// user.
function unityShowBanner(msg, type) {
    function updateBannerVisibility() {
    warningBanner.style.display = warningBanner.children.length ? 'block' : 'none';
    }
    var div = document.createElement('div');
    div.innerHTML = msg;
    warningBanner.appendChild(div);
    if (type == 'error') div.style = 'background: red; padding: 10px;';
    else {
    if (type == 'warning') div.style = 'background: yellow; padding: 10px;';
    setTimeout(function() {
        warningBanner.removeChild(div);
        updateBannerVisibility();
    }, 5000);
    }
    updateBannerVisibility();
}

var buildUrl = "Build";
var loaderUrl = "Build/{{{ LOADER_FILENAME }}}";
var config = {
        dataUrl: "Build/{{{ DATA_FILENAME }}}",
        frameworkUrl: "Build/{{{ FRAMEWORK_FILENAME }}}",
        codeUrl: "Build/{{{ CODE_FILENAME }}}",
        streamingAssetsUrl: "StreamingAssets",
        companyName: "{{{ COMPANY_NAME }}}",
        productName: "{{{ PRODUCT_NAME }}}",
        productVersion: "{{{ PRODUCT_VERSION }}}",
        autoSyncPersistentDataPath: true,
        showBanner: unityShowBanner,
#if MEMORY_FILENAME
        memoryUrl: "Build/{{{ MEMORY_FILENAME }}}",
#endif
#if SYMBOLS_FILENAME
        symbolsUrl: "Build/{{{ SYMBOLS_FILENAME }}}",
#endif
        // errorHandler: function(err, url, line) {
        //    alert("error " + err + " occurred at line " + line);
        //    // Return 'true' if you handled this error and don't want Unity
        //    // to process it further, 'false' otherwise.
        //    return true;
};

console.log("Configuration:", config);


// By default Unity keeps WebGL canvas render target size matched with
// the DOM size of the canvas element (scaled by window.devicePixelRatio)
// Set this to false if you want to decouple this synchronization from
// happening inside the engine, and you would instead like to size up
// the canvas DOM size and WebGL render target sizes yourself.
// config.matchWebGLToCanvasSize = false;

if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    // Mobile device style: fill the whole browser client area with the game canvas:
    var meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, height=device-height, initial-scale=1.0, user-scalable=no, shrink-to-fit=yes';
    document.getElementsByTagName('head')[0].appendChild(meta);
}


canvas.style.background = 'linear-gradient(to right, white, red 0%, transparent 0%, transparent) no-repeat center';
loadingBar.style.display = "block";

var script = document.createElement("script");
script.src = loaderUrl;
script.onload = () => {
    createUnityInstance(canvas, config, (progress) => {
        // console.log("[Unity] Loading progress: " + (progress * 100).toFixed(2) + "%");
    }).then((unityInstance) => {
    loadingBar.style.display = "none";
    }).catch((message) => {
    alert(message);
    });
};
document.body.appendChild(script);


function onResize() {
    var container = canvas.parentElement;
    var w;
    var h;
    var scaleToFit = true;

    if (scaleToFit) {
        w = window.innerWidth;
        h = window.innerHeight;

        var r = {{{ HEIGHT }}} / {{{ WIDTH }}};

        if (w * r > window.innerHeight) {
            w = Math.min(w, Math.ceil(h / r));
        }
        h = Math.floor(w * r);
    } else {
        w = {{{ WIDTH }}};
        h = {{{ HEIGHT }}};
    }

    container.style.width = canvas.style.width = w + "px";
    container.style.height = canvas.style.height = h + "px";
    container.style.top = Math.floor((window.innerHeight - h) / 2) + "px";
    container.style.left = Math.floor((window.innerWidth - w) / 2) + "px";
    window.focus();
}
window.addEventListener('resize', onResize);
onResize();