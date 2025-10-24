'use strict';
import app from "./app";
import dotenv from "dotenv";
dotenv.config();

let PORT: number;
if (process.env.PORT) {
    PORT = +process.env.PORT;
} else {
    PORT = 3000;
}

const server = app();
server.listen({ port: PORT }, function (err, address) {
    if (err) {
      server.log.error(err);
      process.exit(1);
    }
    server.log.info(`Server is running on: ${address}`);
});