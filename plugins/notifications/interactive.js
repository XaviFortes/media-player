const { notificationImage, icons } = require("./utils");
const getSongControls = require('../../providers/song-controls');
const registerCallback = require("../../providers/song-info");
const is = require("electron-is");
const WindowsToaster = require('node-notifier').WindowsToaster;

const notifier = new WindowsToaster({
    withFallback: true,
    appID: "com.xavifortes.media-player",
    appName: "Media Player",
    customArgs: [
        "--appID", "com.xavifortes.media-player",
        "--appName", "Media Player"
    ],



    // Optional:
    // appIcon: pathToAppIcon,
    // appIconMask: pathToAppIconMask,
    // sound: pathToSound,
    // soundVolume: 0.5,
    // wait: true,
    // open: true,
    // openDelay: 0,
    // close: true,
    // closeDelay: 0,
    // actions: [
    //     {
    //         title: "Action 1",
    //         action: () => {
    //             console.log("Action 1");
    //         }
    //     },
    //     {
    //         title: "Action 2",
    //         action: () => {
    //             console.log("Action 2");
    //         }
    //     }
    // ],
    // firstClick: () => {  console.log("First click"); },
    // secondClick: () => { console.log("Second click"); },
    // mouseOver: () => { console.log("Mouse over"); },
    // mouseOut: () => { console.log("Mouse out"); },
    // mouseDown: () => { console.log("Mouse down"); },
    // mouseUp: () => { console.log("Mouse up"); },
    // mouseMove: () => { console.log("Mouse move"); },
    // mouseWheel: () => { console.log("Mouse wheel"); },
    // keyDown: () => { console.log("Key down"); },
    // keyUp: () => { console.log("Key up"); },
    // keyPress: () => { console.log("Key press"); },
    // dragStart: () => { console.log("Drag start"); },
    // dragEnd: () => { console.log("Drag end"); },
    // dragEnter: () => { console.log("Drag enter"); },
    // dragLeave: () => { console.log("Drag leave"); },
    // dragOver: () => { console.log("Drag over"); },
    // drop: () => { console.log("Drop"); },
    // scroll: () => { console.log("Scroll"); },
    // resize: () => { console.log("Resize"); },
    // move: () => { console.log("Move"); },
    // minimize: () => { console.log("Minimize"); },
    // maximize: () => { console.log("Maximize"); },
    // restore: () => { console.log("Restore"); },
    // close: () => { console.log("Close"); },
    // blur: () => { console.log("Blur"); },
    // focus: () => { console.log("Focus"); },
    // show: () => { console.log("Show"); },
    // hide: () => { console.log("Hide"); },
});

//store song controls reference on launch
let controls;
let notificationOnUnpause;

module.exports = (win, unpauseNotification) => {
    //Save controls and onPause option
    const { playPause, next, previous } = getSongControls(win);
    controls = { playPause, next, previous };
    notificationOnUnpause = unpauseNotification;

    let currentUrl;

    // Register songInfoCallback
    registerCallback(songInfo => {
        if (!songInfo.isPaused && (songInfo.url !== currentUrl || notificationOnUnpause)) {
            currentUrl = songInfo.url;
            sendToaster(songInfo);
        }
    });

    win.webContents.once("closed", () => {
        deleteNotification()
    });
}

//delete old notification
let toDelete;
function deleteNotification() {
    if (toDelete !== undefined) {
        // To remove the notification it has to be done this way
        const removeNotif = Object.assign(toDelete, {
            remove: toDelete.id
        })
        notifier.notify(removeNotif)

        toDelete = undefined;
    }
}

//New notification
function sendToaster(songInfo) {
    deleteNotification();
    //download image and get path
    let imgSrc = notificationImage(songInfo, true);
    toDelete = {
        appID: is.dev() ? undefined : "com.xavifortes.media-player",
        title: songInfo.title || "Playing",
        message: songInfo.artist,
        id: parseInt(Math.random() * 1000000, 10),
        icon: imgSrc,
        actions: [
            icons.previous,
            songInfo.isPaused ? icons.play : icons.pause,
            icons.next
        ],
        customArgs: [
            "--appID", "com.xavifortes.media-player",
            "--appName", "Media Player"
        ],
        sound: false,
    };
    //send notification
    notifier.notify(
        toDelete,
        (err, data) => {
            // Will also wait until notification is closed.
            if (err) {
                console.log(`ERROR = ${err.toString()}\n DATA = ${data}`);
            }
            switch (data) {
                //buttons
                case icons.previous.normalize():
                    controls.previous();
                    return;
                case icons.next.normalize():
                    controls.next();
                    return;
                case icons.play.normalize():
                    controls.playPause();
                    // dont delete notification on play/pause
                    toDelete = undefined;
                    //manually send notification if not sending automatically
                    if (!notificationOnUnpause) {
                        songInfo.isPaused = false;
                        sendToaster(songInfo);
                    }
                    return;
                case icons.pause.normalize():
                    controls.playPause();
                    songInfo.isPaused = true;
                    toDelete = undefined;
                    sendToaster(songInfo);
                    return;
                //Native datatype
                case "dismissed":
                case "timeout":
                    deleteNotification();
            }
        }

    );
}
