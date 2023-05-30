const { readFileSync } = require("fs");

const clipboard = nw.Clipboard.get();
const tabsdiv = document.getElementById("tabs");
const viewcontdiv = document.getElementById("viewcont");

const adbh = readFileSync("./src/tabman/adbh.txt", "utf8").split("\n");
let procadbh = [];

adbh.forEach((h) => {
  if (h[0] === "#" || h.length === 0) return;
  procadbh.push(`*://${h.slice(8)}/*`);
});

function block() {
  return { cancel: true };
}

class tab {
  active;
  view;
  tab;
  interval;
  adbstate;

  constructor(url, active) {
    this.active = active;
    this.view = document.createElement("webview");
    this.tab = document.createElement("button");
    this.view.classList.add("views");
    if (!active) this.view.classList.add("hidden");
    this.view.src = url;
    this.view.partition = "persist:prouzr";
    this.tab.textContent = url;
    this.view.addEventListener("contentload", () => {
      this.view.executeScript({
        code: `
                if (!window.scale) {
                    window.scale = 1;
                    document.addEventListener("wheel", (e) => {
                        if (e.ctrlKey) {
                            if (e.deltaY > 0) {
                                window.scale = Math.max(window.scale - 0.25, 0.25);
                            } else {
                                window.scale = Math.min(window.scale + 0.25, 5);
                            }
                        }
                    });
                    document.addEventListener("keyup", (ev) => {
                        if (ev.key === "Escape") {
                            document.exitFullscreen();
                        }
                    })
                }`,
      });
    });

    this.interval = setInterval(() => {
      this.view.executeScript(
        {
          code: "document.title",
        },
        (res) => {
          if (!res) return;
          this.tab.textContent = res[0];
        }
      );

      this.view.executeScript(
        {
          code: "window.scale",
        },
        (scale) => {
          if (!scale) return;
          this.view.setZoom(scale[0]);
        }
      );
    }, 150);

    this.view.addEventListener("loadstart", () => {
      this.tab.textContent = "loading";
    });

    this.view.addEventListener("permissionrequest", (ev) => {
      ev.request.allow();
    });

    this.view.addEventListener("dialog", (type, text) => {
      switch (type) {
        case "alert":
          return alert(text);
        case "confirm":
          return confirm(text);
        case "prompt":
          return prompt(text);
      }
    });

    this.view.contextMenus.create({
      contexts: ["link"],
      title: "copy link address",
      onclick: (info) => {
        clipboard.set(info.linkUrl);
      },
    });

    this.view.contextMenus.create({
      contexts: ["image"],
      title: "copy image address",
      onclick: (info) => {
        clipboard.set(info.srcUrl);
      },
    });

    this.view.request.onBeforeRequest.addListener(block, { urls: procadbh }, [
      "blocking",
    ]);
    
    this.adbstate = true;
    this.tab.className = "tab";
    tabsdiv.append(this.tab);
    viewcontdiv.append(this.view);
  }

  back() {
    this.view.back();
  }

  forward() {
    this.view.forward();
  }

  reload() {
    this.view.reload();
  }

  setsrc(src) {
    this.view.src = src;
  }

  setactive(state) {
    if (state) {
      this.view.classList.remove("hidden");
      this.tab.classList.add("active");
    } else {
      this.view.classList.add("hidden");
      this.tab.classList.remove("active");
    }
    this.active = state;
  }

  toggleadblock() {
    if (this.adbstate) {
      this.view.request.onBeforeRequest.removeListener(block);
      this.adbstate = false;
    } else {
      this.view.request.onBeforeRequest.addListener(block, { urls: procadbh }, [
        "blocking",
      ]);
    }
    this.reload();
  }

  cleanup() {
    clearInterval(this.interval);
    this.view.remove();
    this.tab.remove();
  }
}

export default tab;
