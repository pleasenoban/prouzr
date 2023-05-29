import tab from "../tabman/tab.js";
const Sortable = require("./Sortable.js");

const nwwin = nw.Window.get();
const tabsdiv = document.getElementById("tabs");
const addbtn = document.getElementById("add");
const backbtn = document.getElementById("back");
const forwardbtn = document.getElementById("forward");
const reloadbtn = document.getElementById("reload");
const dlbtn = document.getElementById("download");
const urlinput = document.getElementById("url");
const searchinput = document.getElementById("search");
const adbtn = document.getElementById("adblock");
let activetab;
let tabarr = [];

nwwin.maximize();

document.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
})

function changeurl(ev) {
    if (urlinput !== document.activeElement)
        urlinput.value = ev.target.src;
}

tabarr.pushtab = function (item) {
    if (item.active) {
        if (activetab) {
            activetab.view.removeEventListener("loadstop", changeurl);
            activetab.setactive(false);
        }
        item.view.addEventListener("loadstop", changeurl);
        urlinput.value = item.view.src;
        item.setactive(true);
        activetab = item;
    }
    item.tab.addEventListener("click", () => {
        activetab.view.removeEventListener("loadstop", changeurl);
        activetab.setactive(false);
        item.view.addEventListener("loadstop", changeurl);
        urlinput.value = item.view.src;
        item.setactive(true);
        activetab = item;
    })
    item.tab.addEventListener("dblclick", () => {
        item.cleanup();
        this.splice(this.indexOf(item), 1);
        this[this.length - 1].view.addEventListener("loadstop", changeurl);
        urlinput.value = this[this.length - 1].view.src;
        this[this.length - 1].setactive(true);
        activetab = this[this.length - 1];
    })
    item.view.addEventListener("newwindow", (ev) => {
        this.pushtab(new tab(ev.targetUrl, true));
    })
    item.view.contextMenus.create({
        contexts: ["link"],
        title: "open in new tab",
        onclick: (info) => {
            this.pushtab(new tab(info.linkUrl, true));
        }
    })
    this.push(item);
    Sortable.create(tabsdiv, {
        group: "tabs",
        swapThreshold: .25,
    });
}

addbtn.addEventListener("click", () => {
    tabarr.pushtab(new tab("https://www.google.com/", true));
});

tabarr.pushtab(new tab("https://www.google.com/", true));

backbtn.addEventListener("click", () => {
    activetab.back();
})

forwardbtn.addEventListener("click", () => {
    activetab.forward();
})

reloadbtn.addEventListener("click", () => {
    activetab.reload();
})

urlinput.addEventListener("focusin", () => {
    urlinput.select();
})

urlinput.addEventListener("keyup", (ev) => {
    if (ev.key === "Enter") {
        if (!urlinput.value.match(/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i)) {
            urlinput.value = "http://" + urlinput.value;
        }
        activetab.setsrc(urlinput.value);
        ev.target.blur();
    }
})

searchinput.addEventListener("keyup", (ev) => {
    if (ev.key === "Enter") {
        urlinput.value = "https://www.google.com/search?q=" + encodeURIComponent(searchinput.value);
        activetab.setsrc(urlinput.value);
        ev.target.blur();
    }
})

dlbtn.addEventListener("click", () => {
    chrome.downloads.search({}, () => {
        window.open("../download/download.html");
    })
})

adbtn.addEventListener("click", () => {
    activetab.toggleadblock();
})