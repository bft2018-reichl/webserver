const http = require("http");
const fs = require("fs");
const path = require("path");
const mime = require("mime");
const socketio = require("socket.io");

// Datenbank:
const { Pool } = require('pg');

const pool = new Pool({
    user: 'nodejs',
    host: '10.17.1.100',
    database: 'nodejs',
    password: 'geheim',
    port: 5432,             // 5432 3211
});

async function datenbankBenutzerAnlegen(name, passwort) {
    const client = await pool.connect();
    let res;
    try {
        await client.query('BEGIN');
        const queryText = 'INSERT INTO benutzer(name, passwort) VALUES($1, $2) RETURNING id';
        res = await client.query(queryText, [name, passwort]);
        await client.query('COMMIT');
    } catch (e) {
        console.log("Fehler: " + e);
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
        return res;
    }
}

async function datenbankBenutzerLogin(name, passwort) {
    const client = await pool.connect();
    let res;
    try {
        await client.query('BEGIN');
        const queryText = 'SELECT id FROM benutzer WHERE name=$1 AND passwort=$2';
        res = await client.query(queryText, [name, passwort]);
        await client.query('COMMIT');
    } catch (e) {
        console.log("Fehler: " + e);
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
        return res;
    }
}


// Webserver --------------------------------------------------

function meineServerFunktion(anfrage, antwort) {
    console.log("Aufgerufene URL: " + anfrage.url);

    const dateipfad = "./public" + anfrage.url;
    console.log("Zu versendende Datei: " + dateipfad);

    // antwort.write("Du hast " + anfrage.url + " aufgerufen.");
    // antwort.end();

    fs.readFile(dateipfad, function (fehler, daten) {
        if (fehler) {
            antwort.writeHead(404, { 'Content-Type': 'text/plain' });
            antwort.write("Datei nicht gefunden. Fehler: " + fehler);
            antwort.end();
        } else {
            antwort.writeHead(200, {
                'Content-Type':
                    mime.getType(path.basename(dateipfad))
            });
            antwort.write(daten);
            antwort.end();
        }
    });
}

const meinWebserver = http.createServer(meineServerFunktion);
meinWebserver.listen(3000);
console.log("Webserver hört auf Port 3000");

// Programmierung der WebSockets mit socket.io:

// Verbinden von WebSockets mit Webserver:
const io = socketio.listen(meinWebserver);

// Was tun wir, wenn sich jemand mit uns verbindet:
io.on('connection', function (socket) {
    console.log("Neue Verbindung hergestellt.");
    console.log("Socket-ID: " + socket.id);

    socket.on("Chat-Nachricht", function(text) {
        console.log("Chat-Nachricht: " + text);
        io.emit("Nachricht an alle", text);
    });

    // Was mache ich, wenn der Browser sich abmeldet...:
    socket.on("disconnect", function () {
        console.log(socket.id + " hat sich abgemeldet.");
    });

    socket.on("Benutzer anlegen", function(daten) {
        console.log("Benutzer anlegen:");
        console.log(daten.name);
        console.log(daten.passwort);
        datenbankBenutzerAnlegen(daten.name, daten.passwort).then(function(res) {
            socket.emit("Benutzer anlegen Antwort","Erfolgreich angelegt. ID="+res.rows[0].id);
        }).catch(function(grund){
            socket.emit("Benutzer anlegen Antwort", "Fehler: "+ grund);
        });
    });

    socket.on("Benutzer login", function(daten){
        console.log("Benutzer login:")
        console.log(daten.name);
        console.log(daten.passwort);
        datenbankBenutzerLogin(daten.name, daten.passwort).then(function(res) {
            if (res.rows.length > 0) {
                socket.emit("Benutzer login Antwort","Erfolgreich angelegt. ID="+res.rows[0].id);
            } else {
                socket.emit("Benutzer login Antwort","Benutzername und Passwort passen nicht zusammen");
            }
        }).catch(function(grund){
            socket.emit("Benutzer anlegen Antwort", "Fehler: "+ grund);
        });
    });
});

