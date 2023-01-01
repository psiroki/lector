const swUsed = "serviceWorker" in navigator;

const hasChapterPattern = /[\p{L}0-9]\p{L}+\s*[0-9]/u;

function restrictedValue(inp) {
  const val = inp.value;
  return inp.selectionStart < val.length && inp.selectionEnd >= val.length
    ? val.substring(0, inp.selectionStart)
    : val;
}

function locationInput(books, event) {
  const inp = this;
  const val = inp.value.toLowerCase();
  const bookList = document.querySelector("#bookList");
  bookList.textContent = "";
  if (!val || hasChapterPattern.test(val)) return;
  const matches = books.filter(b => b["abbrev"].toLowerCase().startsWith(val));
  bookList.append(...matches.map(e => {
    const name = e["name"];
    const abbrev = e["abbrev"];
    const abbr = document.createElement("abbr");
    const span = document.createElement("span");
    const item = document.createElement("div");
    item.append(abbr, span);
    abbr.textContent = abbrev;
    span.textContent = name;
    item.addEventListener("click", _ => {
      inp.value = abbrev;
      bookList.textContent = "";
      inp.focus();
    });
    return item;
  }));
}

function inclusiveElementRange(start, end) {
  r = document.createRange();
  r.setStartBefore(start);
  r.setEndAfter(end);
  return r;
}

function selectElement(target) {
  const sel = window.getSelection();
  let r;
  if (target instanceof Range) {
    r = target;
  } else {
    r = document.createRange();
    r.selectNodeContents(target);
  }
  sel.removeAllRanges();
  sel.addRange(r);
}

async function displayLocation(loc) {
  const locResponse =
    await (await fetch("https://szentiras.hu/api/idezet/"+encodeURIComponent(loc)+"/KNB")).json();
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  const close = document.createElement("span");
  const df = document.createDocumentFragment();
  const dl = document.querySelector("#results");

  df.append(dt, dd);
  dl.insertBefore(df, dl.firstChild);

  close.className = "close";
  close.addEventListener("click", e => {
    for (let e of [dt, dd]) {
      try {
        e.remove();
      } catch (e) {
        // yeah, whatever...
      }
    }
  });

  dt.textContent = loc;
  dt.append(close);
  dd.innerHTML = locResponse["valasz"]["versek"].map(e => e["szoveg"]).join(" ");
  dd.addEventListener("click", event => selectElement(event.currentTarget));
  dt.addEventListener("click", event => {
    if (event.target === event.currentTarget)
      selectElement(inclusiveElementRange(dt, dd));
  });
}

function startLoadLocation() {
  const inp = this;
  const val = inp.value.replace(/\/+/g, "");
  if (!hasChapterPattern.test(val) || val.indexOf('%') >= 0 || val.indexOf('?') >= 0 || val.indexOf('#') >= 0) return;
  displayLocation(val);
}

function maybeJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch (e) {
    return null;
  }
}

async function main() {
  if (swUsed) {
    navigator.serviceWorker.addEventListener("message", event => {
      const msg = event.data;
      if ("version" in msg) {
        const ver = document.querySelector("#ver");
        ver.textContent = msg["version"];
      }
    });
    navigator.serviceWorker.ready.then(reg => reg.active.postMessage({"action": "hi"}));
  }
  const booksResponse = maybeJson("lectorBooks") ?? await fetch("https://szentiras.hu/api/books/KNB").then(r => r.json());
  localStorage.setItem("lectorBooks", JSON.stringify(booksResponse));
  const loc = document.querySelector("#location");
  loc.addEventListener("input", locationInput.bind(loc, booksResponse["books"]));
  loc.addEventListener("search", startLoadLocation.bind(loc));
}

if (swUsed) {
	navigator.serviceWorker.register("/lector/lsw.js").catch(main).then(main);
} else {
  main();
}


