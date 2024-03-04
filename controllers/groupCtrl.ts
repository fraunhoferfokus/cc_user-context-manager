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

import express from 'express'
import { BaseCtrl } from './BaseCtrl'

class GroupCtrl extends BaseCtrl {

    router: express.Router

    constructor() {
        super()
        this.router = express.Router()
        this.configure_routes()
    }

    configure_routes() {
        this.router.get('/', this.getGroups)
        this.router.get('/:id', this.getGroup)
    }

    /**
   * @openapi
   * /groups:
   *   get:
   *     description: Welcome to swagger-jsdoc!
   *     responses:
   *       200:
   *         description: Returns group-object list.
   *         content:
   *           application/json:
   *              schema:
   *                  type: array
   *                  items:
   *                       $ref: "#/components/schemas/Group"
   * 
   */
    getGroups: express.Handler = async (req, res, next) => {
        try {
            const users = await this.adapter.getGroups({ req, res })
            return res.json(users)
        } catch (err: any) {
            console.error(err)
            return next(err)
        }
    }

    /**
    * @openapi
    * /groups/{id}:
    *   get:
    *     description: Welcome to swagger-jsdoc!
    *     responses:
    *       200:
    *         description: Returns group-object list.
    *         content:
    *           application/json:
    *              schema:
    *                  type: array
    *                  items:
    *                       $ref: "#/components/schemas/Group"
    * 
    */
    getGroup: express.Handler = async (req, res, next) => {
        try {
            const user = await this.adapter.getGroup(req.params.id, { req, res })
            if (!user) return res.status(404).send('group not found')
            return res.json(user)
        } catch (err: any) {
            console.error(err)
            return next(err)
        }
    }






}

export default new GroupCtrl().router








