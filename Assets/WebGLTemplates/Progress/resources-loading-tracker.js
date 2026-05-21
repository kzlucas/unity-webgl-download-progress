
var tracker = (function () {

    let prevTotalProgress = 0;
    let totalProgress = 0;
    const progressWrapper = document.querySelector("#unity-load-progress");
    const progressBar = document.querySelector("#unity-load-progress--bar");
    const progressPct = document.querySelector("#unity-load-progress--percent");
    const progressMessage = document.querySelector("#unity-load-progress--message");
    const trackedFiles = TRACKED_FILES;
    const loadingMessages = LOADING_MESSAGES;

    return {
        getAll: function () {
            return trackedFiles;
        },
        get: function (uri) {
            return trackedFiles.find(f => uri.includes(f.uri));
        },
        isTracked: function (uri) {
            return trackedFiles.some(f => uri.includes(f.uri));
        },
        setContentLength: function (uri, val) {
            let file = this.get(uri);
            if (file)
                file.contentLength = val;
            else
                console.warn(`Trying to set contentLength for untracked file ${uri}`);
        },
        setBitReceived: function (uri, val) {
            let file = this.get(uri);
            if (file.progress === 1)
                return; // already done, no need to update
            if (file)
                file.bitReceived = val;
            else
                console.warn(`Trying to set bitReceived for untracked file ${uri}`);
            file.progress = file.contentLength > 0 ? Math.min(file.bitReceived / file.contentLength, 1) : 1;

            // lerp totalProgress for smoother progress bar movement
            prevTotalProgress = totalProgress;
            const nextTotalProgress = trackedFiles.reduce((sum, f) => sum + f.progress, 0) / trackedFiles.length;
            const progressDelta = nextTotalProgress - prevTotalProgress;
            totalProgress = prevTotalProgress + progressDelta * 0.01; // adjust 0.1 for faster/slower lerp
        },
        setDone: function (uri) {
            let file = this.get(uri);
            if (file) {
                console.log(`✅ Finished loading ${uri}`);
                this.setBitReceived(uri, file.contentLength); // mark as fully loaded
                console.log(`Progress for ${uri}: ${(file.progress * 100).toFixed(2)}%`);
                this.updateProgressBar();
                console.log(this.getAll())
            }
            else
                console.warn(`Trying to set done for untracked file ${uri}`);
        },
        updateProgressBar: function () {
            progressBar.value = totalProgress * 100;
            progressPct.innerText = Math.round(totalProgress * 100) + "%";
            if (totalProgress == 0 || totalProgress == 1)
                progressWrapper.style.display = "none";
            else
                progressWrapper.style.display = "flex";

            if (totalProgress > 0 && totalProgress < 1) {
                const msgIndex = Math.floor(totalProgress * loadingMessages.length);
                progressMessage.innerText = loadingMessages[msgIndex];
            }
            if (this.getAll().every(f => f.progress === 1)) {
                progressMessage.innerText = LAUNCHING_MESSAGE;
                progressPct.innerText = "100%";
                progressBar.value = 100;
            }
        },

        // Called from Unity via WebGLBridge.jslib and WebGLBridge.cs when the engine is ready, to hide the progress bar and show the canvas
        hideProgressBar: function () {
            progressWrapper.style.visibility = "hidden";
            progressWrapper.style.display = "none";
        }
    }
}());



/**
*
* Watch the global fetch with custom logic by overriding it 
*/

const originalFetch = fetch;
fetch = function (resource, options) {

    return originalFetch(resource, options).then(response => {

        const url = typeof resource === "string" ? resource : resource.url;

        if (!response.body || !tracker.isTracked(url)) {
            return response;
        }

        const trackedFile = tracker.get(url);
        const contentLength = parseInt(response.headers.get("Content-Length"))
            || trackedFile.contentLength
            || 0;

        tracker.setContentLength(url, contentLength); // update in case we had a real value instead of fallback

        console.log(`📡 Tracking file at ${url} with content-length: ${contentLength}`);


        const reader = response.clone().body.getReader(); // clone, NOT original
        let received = 0;
        function read() {
            return reader.read().then(({ done, value }) => {

                if (done) {
                    received = contentLength; // mark as fully loaded
                    tracker.setDone(url);
                    return;
                }
                else {
                    received += value.byteLength;
                }

                tracker.setBitReceived(url, received);
                tracker.updateProgressBar();

                if (done) return;
                return read();
            });
        }

        read(); // fire and forget

        return response; // ORIGINAL untouched
    });
};