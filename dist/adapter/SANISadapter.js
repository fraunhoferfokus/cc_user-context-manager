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
exports.SANISAdpater = void 0;
const axios_1 = __importDefault(require("axios"));
const BaseASAdapter_1 = require("./BaseASAdapter");
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;
const OIDC_AUTH_ENDPOINT = process.env.OIDC_AUTH_ENDPOINT;
const AS_API_ENDPOINT = process.env.USER_SERVER_ENDPOINT;
class SANISAdpater extends BaseASAdapter_1.BaseASAdapter {
    configureContext() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const currTime = new Date();
                if (this.context.expires_in < currTime) {
                    const response = yield axios_1.default.post(OIDC_AUTH_ENDPOINT, {
                        client_id: KEYCLOAK_CLIENT_ID,
                        client_secret: KEYCLOAK_CLIENT_SECRET,
                        grant_type: 'client_credentials',
                    }, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    });
                    this.context.config = {
                        headers: {
                            Authorization: `Bearer ${response.data.access_token}`
                        }
                    };
                    this.context.expires_in = new Date(currTime.getTime() + response.data.expires_in * 1000);
                }
                return Promise.resolve(true);
            }
            catch (err) {
                throw err;
            }
        });
    }
    user(personenKontextId, opt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = (yield this.users(opt)).find((user) => user.id === personenKontextId);
                return user;
            }
            catch (err) {
                throw err;
            }
        });
    }
    groups(opt) {
        return __awaiter(this, void 0, void 0, function* () {
            const { req } = opt;
            try {
                const [response, response2] = yield Promise.all([
                    axios_1.default.get(AS_API_ENDPOINT + '/v1/personen', this.context.config),
                    axios_1.default.get(AS_API_ENDPOINT + '/v1/gruppen', this.context.config),
                    // Personenkontexte
                    // axios.get(AS_API_ENDPOINT + '/v1/personenkontexte', this.context.config),
                ]);
                const [personen, gruppen] = [response.data, response2.data];
                return gruppen.map(({ gruppe, gruppenzugehoerigkeiten }) => {
                    const users = [];
                    if (gruppenzugehoerigkeiten) {
                        for (const gruppenzugehoerigkeit of gruppenzugehoerigkeiten) {
                            for (const person of personen) {
                                const { personenkontexte } = person;
                                const found = personenkontexte === null || personenkontexte === void 0 ? void 0 : personenkontexte.find(({ id }) => id === gruppenzugehoerigkeit.ktid);
                                if (found) {
                                    users.push(found.id);
                                }
                            }
                        }
                    }
                    return {
                        id: gruppe.id,
                        displayName: gruppe.bezeichnung,
                        users
                    };
                });
            }
            catch (err) {
                throw err;
            }
        });
    }
    users(opt) {
        return __awaiter(this, void 0, void 0, function* () {
            const { req } = opt;
            const requesting_user = req === null || req === void 0 ? void 0 : req.session.user;
            const sanis_personenkontext_id = requesting_user.preferred_username;
            try {
                const [response, response2, response3, response4, response5] = yield Promise.all([
                    axios_1.default.get(AS_API_ENDPOINT + '/v1/personen', this.context.config),
                    axios_1.default.get(AS_API_ENDPOINT + '/v1/gruppen', this.context.config),
                    axios_1.default.get(AS_API_ENDPOINT + '/v1/organisationen', this.context.config),
                    axios_1.default.get(AS_API_ENDPOINT + `/v1/personenkontexte`, this.context.config),
                    axios_1.default.get(AS_API_ENDPOINT + `/v1/gruppenzugehoerigkeiten`, this.context.config)
                ]);
                // axios.get(AS_API_ENDPOINT + `/v1/personenkontexte/${sanis_personenkontext_id}`, this.context.config)
                // const personen_kontext_data = personen_kontext_response.data
                // const org_id = personen_kontext_data.personenkontexte[0].organisation.id
                const [sanisPersonen, sanisGruppen, sanisOrgs, personenkontexte, gruppenzugehoerigkeitenGr] = [response.data, response2.data, response3.data, response4.data, response5.data];
                let personen = [];
                sanisPersonen.map(({ person, personenkontexte }) => {
                    let orgs = [];
                    let ktids = [];
                    if (personenkontexte) {
                        for (const personenkontext of personenkontexte) {
                            let groups = [];
                            gruppenzugehoerigkeitenGr.forEach(({ gruppenzugehoerigkeiten, gruppe: sub_set_gruppe }) => {
                                const found = gruppenzugehoerigkeiten === null || gruppenzugehoerigkeiten === void 0 ? void 0 : gruppenzugehoerigkeiten.find(({ ktid }) => ktid === personenkontext.id);
                                if (found) {
                                    const sanisGruppe = sanisGruppen.find(({ gruppe }) => {
                                        return gruppe.id === sub_set_gruppe.id;
                                    });
                                    const real_group = sanisGruppe.gruppe;
                                    groups.push({
                                        id: real_group.id,
                                        orgid: real_group.orgid,
                                        role: found.rollen[0],
                                        displayName: real_group.bezeichnung,
                                    });
                                }
                            });
                            personen.push({
                                id: personenkontext.id,
                                email: `${person.name.vorname} ${person.name.familienname}`,
                                groups: groups,
                                orgs,
                                role: personenkontext.rolle
                            });     
                        }
                    }
                });
                return personen;
            }
            catch (err) {
                throw err;
            }
        });
    }
    group(id, opt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const group = (yield this.groups(opt)).find((group) => group.id === id);
                return group;
            }
            catch (err) {
                throw err;
            }
        });
    }
}
exports.SANISAdpater = SANISAdpater;
