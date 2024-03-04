/* -----------------------------------------------------------------------------
*  Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, version 3.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.  
 *
 *  No Patent Rights, Trademark Rights and/or other Intellectual Property
 *  Rights other than the rights under this license are granted.
 *  All other rights reserved.
 *
 *  For any other rights, a separate agreement needs to be closed.
 *
 *  For more information please contact:  
 *  Fraunhofer FOKUS
 *  Kaiserin-Augusta-Allee 31
 *  10589 Berlin, Germany
 *  https://www.fokus.fraunhofer.de/go/fame
 *  famecontact@fokus.fraunhofer.de
 * -----------------------------------------------------------------------------
 */
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const groupCtrl_1 = __importDefault(require("./controllers/groupCtrl"));
const userCtrl_1 = __importDefault(require("./controllers/userCtrl"));
const verfiy_id_token_1 = require("./middlewares/verfiy_id_token");
const connect_redis_1 = __importDefault(require("connect-redis"));
const redis_1 = require("redis");
const express_session_1 = __importDefault(require("express-session"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: process.env.DEPLOY_URL,
    credentials: true
}));
let redisClient = (0, redis_1.createClient)({
    url: `redis://${process.env.REDIS_HOST || "redis"}:${process.env.REDIS_PORT || "6379"}`
});
redisClient.connect().catch((err) => {
    console.error(err);
});
// @ts-ignore
let redisStore = new connect_redis_1.default({
    // @ts-ignore
    client: redisClient,
    prefix: "myapp:",
});
const USER_SERVER_ENDPOINT = process.env.USER_SERVER_ENDPOINT;
let memoryCache = [];
/**
 * @openapi
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - id
 *         - groups
 *       properties:
 *         email:
 *           type: string
 *           example: admin@admin.de
 *         id:
 *           type: string
 *           example: cc8f89a9-91fc-4972-baf4-2bb7f3af7800
 *         groups:
 *            type: array
 *            items:
 *              type: object
 *              properties:
 *                  id:
 *                      type: string
 *                      example: 3c8f89a9-91fc-4972-baf4-2bb7f3af7805
 *                  displayName:
 *                      type: string
 *                      example: Group-1
 *                  role:
 *                      type: string
 *                      example: Lehrer

 */
/**
 * @openapi
 * components:
 *   schemas:
 *     Group:
 *       type: object
 *       required:
 *         - displayName
 *         - id
 *         - users
 *       properties:
 *         displayName:
 *               type: string
 *               example: Group-1
 *         id:
 *               type: string
 *               example: 3c8f89a9-91fc-4972-baf4-2bb7f3af7805
 *         users:
 *               type: array
 *               items:
 *                  type: string
 *                  description: the ids of the users
 *       xml:
 *         name: Metadata
 *       additionalProperties: false
 */
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Auth-Manager',
            version: '1.0.0',
        },
    },
    apis: ['./server.ts', './controllers/*'], // files containing annotations as above
};
const openApiSpecification = (0, swagger_jsdoc_1.default)(options);
app.use((0, express_session_1.default)({
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: "keyboard cat",
}));
app.get('/api-docs', (req, res, next) => {
    return res.json(openApiSpecification);
});
app.use(verfiy_id_token_1.verify_access_token);
app.use('/users', userCtrl_1.default);
app.use('/groups', groupCtrl_1.default);
const errHandler = (err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || 'Something went wrong';
    res.status(status).send(message);
};
app.use(errHandler);
const PORT = parseInt(process.env.PORT);
app.listen(PORT, () => {
    console.info(`listening on PORT: ${PORT}`);
});
