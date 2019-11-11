// main.js für den Browser

"use strict";

const socket = io.connect();

// socket.on("Nachricht vom Server", function(daten){
//     document.write("Nachricht vom Server: " + daten + "<br>");
// });

// socket.emit("Nachricht vom Browser", "Viele Grüße vom Browser!");

function sendeEingabe() {
    let eingabeFeld = document.getElementById("eingabeText");
    let text = eingabeFeld.value;
    socket.emit("Chat-Nachricht", text);
    eingabeFeld.value = "";
}

socket.on("Nachricht an alle", function (text) {
    let li = document.createElement("li");
    let textNode = document.createTextNode(text);
    let liste = document.getElementById("liste");
    li.appendChild(textNode);
    liste.appendChild(li);
    let div = document.getElementById("Ausgabe");
    div.scrollTop = div.scrollHeight;
});

async function digestMessage(message) {
    const msgUint8 = new TextEncoder().encode(message);                           // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgUint8);           // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer));                     // convert buffer to byte array
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join(''); // convert bytes to hex string
    return hashHex;
}


function benutzerAnlegen() {
    const ausgabe = document.getElementById("hashAusgabe");
    const passwort = document.getElementById("eingabePasswort").value;
    const passwort2 = document.getElementById("eingabePasswort2").value;
    if (passwort !== passwort2) {
        ausgabe.innerText = "Die Passwörter passen nicht zusammen!";
    } else {
        const name = document.getElementById("benutzername").value.trim();
        digestMessage(passwort).then(function (hashWert) {
            socket.emit("Benutzer anlegen", { name: name, passwort: hashWert});
            ausgabe.innerText="Anmeldung an den Server geschickt.";
        });
    }
}

socket.on("Benutzer anlegen Antwort", function(daten) {
    const ausgabe = document.getElementById("hashAusgabe");
    ausgabe.innerText = daten;
});

function benutzerLogin() {
    const ausgabe = document.getElementById("loginAusgabe");
    const passwort = document.getElementById("loginPasswort").value;
    const name = document.getElementById("loginName").value.trim();
    digestMessage(passwort).then(function (hashWert) {
        socket.emit("Benutzer login", { name: name, passwort: hashWert});
        ausgabe.innerText="Login an den Server geschickt.";
    });
}

socket.on("Benutzer login Antwort", function(daten) {
    const ausgabe = document.getElementById("loginAusgabe");
    ausgabe.innerText = daten;
});