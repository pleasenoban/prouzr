const { execFile } = require("child_process");
const os = require("os").type();
const fs = require("fs");

const itcontdiv = document.getElementById("itcontdiv");
const clearbtn = document.getElementById("clear");

function handleitem(item) {
  if (!fs.existsSync(item.filename) && item.state === "complete") return;
  let itdiv = document.createElement("div");
  let openbtn = document.createElement("button");
  let folbtn = document.createElement("button");
  itdiv.className = "item";
  openbtn.className = "open";
  folbtn.className = "folder";
  let filename;
  if (os === "Windows_NT")
    filename = item.filename.substring(
      item.filename.lastIndexOf("\\") + 1,
      item.filename.length
    );
  else
    filename = item.filename.substring(
      item.filename.lastIndexOf("/") + 1,
      item.filename.length
    );
  openbtn.textContent = filename;
  if (item.state === "complete") openbtn.textContent = `complete - ${filename}`;
  else if (item.state === "interrupted")
    openbtn.textContent = `interrupted - ${filename}`;
  folbtn.innerHTML = "&#128193;";
  openbtn.addEventListener("click", () => {
    if (os === "Windows_NT") execFile("start", [item.filename]);
    else if (os === "Linux") execFile("xdg-open", [item.filename]);
    else if (os === "Darwin") execFile("open", [item.filename]);
  });
  folbtn.addEventListener("click", () => {
    if (os === "Windows_NT")
      execFile("explorer", [
        item.filename.substring(0, item.filename.lastIndexOf("\\")),
      ]);
    else if (os === "Linux")
      execFile("xdg-open", [
        item.filename.substring(0, item.filename.lastIndexOf("/")),
      ]);
    else if (os === "Darwin")
      execFile("open", [
        item.filename.substring(0, item.filename.lastIndexOf("/")),
      ]);
  });
  if (item.state === "in_progress") {
    let interval = setInterval(() => {
      chrome.downloads.search(
        {
          id: item.id,
        },
        (it) => {
          let itm = it[0];
          if (os === "Windows_NT")
            filename = itm.filename.substring(
              itm.filename.lastIndexOf("\\") + 1,
              itm.filename.length
            );
          else
            filename = itm.filename.substring(
              itm.filename.lastIndexOf("/") + 1,
              itm.filename.length
            );
          if (itm.state === "complete") {
            clearInterval(interval);
            openbtn.textContent = `complete - ${filename}`;
            return;
          }
          openbtn.textContent = `${Math.round(
            (itm.bytesReceived / itm.totalBytes) * 100
          )}% - ${filename}`;
        }
      );
    }, 500);
  }
  itdiv.append(openbtn, folbtn);
  itcontdiv.append(itdiv);
}

chrome.downloads.search({}, (items) => {
  items.forEach(handleitem);
});

chrome.downloads.onCreated.addListener(handleitem);

clearbtn.addEventListener("click", () => {
  chrome.downloads.erase({}, () => {
    itcontdiv.innerHTML = "";
  });
});
