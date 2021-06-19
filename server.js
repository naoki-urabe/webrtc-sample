"use strict"
const express = require("express");
const http = require("http");

const app = express();
const server = http.Server(app);

const PORT = process.env.PORT || 1337;
app.use(express.static( __dirname + "/public"))
server.listen(
    PORT,
    () => {
        console.log("Server on port %d", PORT);
    }
)