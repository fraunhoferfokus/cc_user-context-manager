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
import dotenv from 'dotenv'
dotenv.config()
process.env.MARIA_CONFIG = process.env.MARIA_CONFIG!.replace('tcp://', '')
import RedisStore from 'connect-redis'
import cors from 'cors'
import express, { ErrorRequestHandler } from 'express'
import session from 'express-session'
import { createClient } from "redis"
import swaggerJSDoc from 'swagger-jsdoc'
import { SANISAdpater } from './adapter/SANISadapter'
import groupCtrl from './controllers/groupCtrl'
import userCtrl from './controllers/userCtrl'
import { verify_access_token } from './middlewares/verfiy_id_token'

const app = express()
app.use(cors({
    origin: process.env.DEPLOY_URL || 'http://localhost:3000',
    credentials: true
}))

let url = process.env.REDIS_URL
let redisClient = createClient(
    {
        url
    }
)

redisClient.connect().then(() => {
    console.info('redis connected')
})
    .catch((err) => {
        console.error(err)
    })
// @ts-ignore
let redisStore = new RedisStore({
    // @ts-ignore
    client: redisClient,
    prefix: "myapp:",
})

// extend express request type
declare global {
    namespace Express {
        interface Request {
            config: any
        }
    }
}

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


const openApiSpecification = swaggerJSDoc(options)


declare module 'express-session' {
    export interface SessionData {
        access_token: string,
        sanis_refresh_token: string,
        id_token: string,
        user?: {
            pid: string,
            personenkontexte: {
                ktid: string,
                organisation: {
                    id: string,
                    name: string
                    typ: string
                }
                rolle: string
            }[]
        }
    }
}


app.get('/api-docs', (req, res, next) => {
    return res.json(openApiSpecification)
})


app.use(
    session({
        store: redisStore,
        resave: false, // required: force lightweight session keep alive (touch)
        saveUninitialized: false, // recommended: only save session when data exists
        secret: process.env.SESSION_SECRET! || "keyboard cat",
    })
)

app.use(verify_access_token)
app.use('/users', userCtrl)
app.use('/groups', groupCtrl)

const errHandler: ErrorRequestHandler = (err, req, res, next) => {
    const status = err.status || 500
    const message = err.message || 'Something went wrong'
    res.status(status).send(message)
}

app.use(errHandler)
const PORT = parseInt(process.env.PORT!)

app.listen(PORT, () => {
    console.info(`listening on PORT: ${PORT}`)
})