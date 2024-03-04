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
exports.verify_access_token = void 0;
const axios_1 = __importDefault(require("axios"));
const OIDC_CERTS_ENDPOINT = process.env.OIDC_CERTS_ENDPOINT;
const verify_access_token = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const access_token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
    if (access_token)
        req.session.access_token = access_token;
    if (req.session.access_token) {
        try {
            const resp = yield axios_1.default.get(`${process.env.OIDC_USERINFO_ENDPOINT}`, {
                headers: {
                    Authorization: `Bearer ${req.session.access_token}`
                }
            });
            req.session.user = resp.data;
            return next();
        }
        catch (err) {
            // if response status of err is 401, then try refresh token
            if (err.response.status === 401) {
                try {
                    const refresh_token = req.session.refresh_token;
                    // get new access token from refresh token
                    const resp2 = yield axios_1.default.post(`${process.env.KEYCLOAK_TOKEN_ENDPOINT}`, {
                        grant_type: 'refresh_token',
                        client_id: process.env.KEYCLOAK_CLIENT_ID,
                        client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
                        refresh_token
                    }, {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    const new_access_token = resp2.data.access_token;
                    req.session.access_token = new_access_token;
                    return next();
                }
                catch (err) {
                    return next(err);
                }
            }
            return next(err);
        }
    }
});
exports.verify_access_token = verify_access_token;
