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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const BaseCtrl_1 = require("./BaseCtrl");
class UserCtrl extends BaseCtrl_1.BaseCtrl {
    constructor() {
        super();
        /**
         * @openapi
         * /users:
         *   get:
         *     description: Welcome to swagger-jsdoc!
         *     responses:
         *       200:
         *         description: Returns users-object list.
         *         content:
         *           application/json:
         *              schema:
         *                  type: array
         *                  items:
         *                       $ref: "#/components/schemas/User"
         *
         */
        this.getUsers = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield this.adapter.getUsers({ req });
                return res.json(users);
            }
            catch (err) {
                console.error(err);
                return next(err);
            }
        });
        /**
     * @openapi
     * /users/{id}:
     *   get:
     *     description: Welcome to swagger-jsdoc!
     *     responses:
     *       200:
     *         description: Returns users-object list.
     *         content:
     *           application/json:
     *              schema:
     *                  $ref: "#/components/schemas/User"
     *
     */
        this.getUser = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield this.adapter.getUser(req.params.id, { req, res });
                if (!user)
                    return res.status(404).send('user not found');
                return res.json(user);
            }
            catch (err) {
                console.error(err);
                return next(err);
            }
        });
        this.router = express_1.default.Router();
        this.configure_routes();
    }
    configure_routes() {
        this.router.get('/', this.getUsers);
        this.router.get('/:id', this.getUser);
    }
}
exports.default = new UserCtrl().router;
