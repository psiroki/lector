const swUsed = "serviceWorker" in navigator;

let lastValue = "";

function locationInput(books, event) {
  const inp = this;
  const val = inp.value.toLowerCase();
  const lastVal = lastValue;
  lastValue = val;
  if (val.length < lastVal.length || !val || /[\p{L}0-9]\p{L}+\s*[0-9]/u.test(val)) return;
  if (inp.selectionStart === inp.selectionEnd && inp.selectionEnd === val.length) {
    const matches = books.filter(b => b["abbrev"].toLowerCase().startsWith(val));
    if (matches.length) {
      const cursor = inp.selectionEnd;
      const exact = matches.find(b => b["abbrev"].toLowerCase() === val);
      const selected = exact || matches[0];
      inp.value = selected["abbrev"];
      inp.setSelectionRange(cursor, inp.value.length);
    }
  }
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
  const locResponse = await fetch("https://szentiras.hu/api/idezet/"+encodeURIComponent(loc)+"/KNB").then(r => r.json());
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  const df = document.createDocumentFragment();
  const dl = document.querySelector("dl");
  df.append(dt, dd);
  dl.insertBefore(df, dl.firstChild);
  dt.textContent = loc;
  dd.innerHTML = locResponse["valasz"]["versek"].map(e => e["szoveg"]).join(" ");
  dd.addEventListener("click", event => selectElement(event.currentTarget));
  dt.addEventListener("click", event => selectElement(inclusiveElementRange(dt, dd)));
}

function startLoadLocation() {
  const inp = this;
  const val = inp.value.replace(/\/+/g, "");
  if (val.indexOf('%') >= 0 || val.indexOf('?') >= 0 || val.indexOf('#') >= 0) return;
  displayLocation(val);
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
  const booksResponse = await fetch("https://szentiras.hu/api/books/KNB").then(r => r.json());
  const loc = document.querySelector("#location");
  loc.addEventListener("input", locationInput.bind(loc, booksResponse["books"]));
  loc.addEventListener("search", startLoadLocation.bind(loc));
}

if (swUsed) {
	navigator.serviceWorker.register("/lector/lsw.js").catch(main).then(main);
} else {
  main();
}


