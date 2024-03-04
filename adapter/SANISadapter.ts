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
import axios from "axios";
import { GroupType } from "../models/GroupType";
import { UserType } from "../models/UserType";
import { BaseASAdapter, Options } from "./BaseASAdapter";

const SANIS_TOKEN_ENDPOINT = process.env.SANIS_TOKEN_ENDPOINT!
const SANIS_API_ENDPOINT = process.env.SANIS_API_ENDPOINT!
const SANIS_ORGS = JSON.parse(process.env.SANIS_ORGS!)

export class SANISAdpater extends BaseASAdapter {



    protected async configureContext({ req }: { req: any }): Promise<any> {
        try {
            const org = SANIS_ORGS.find((org: any) => org.id === req.session.user.personenkontexte[0].organisation.id)
            if (!org) throw new Error('no org found')

            const currTime = new Date()
            if (this.context.expires_in < currTime
                ||
                org !== this.context.org
            ) {
                this.context.org = org
                const response = await axios.post(SANIS_TOKEN_ENDPOINT, {
                    client_id: org.client_id,
                    client_secret: org.client_secret,
                    grant_type: 'client_credentials',
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                })
                this.context.config = {
                    headers: {
                        Authorization: `Bearer ${response.data.access_token}`
                    }
                }
                this.context.expires_in = new Date(currTime.getTime() + response.data.expires_in * 1000)
            }
            return Promise.resolve(true)
        } catch (err: any) {
            throw err
        }

    }

    protected async user(personenKontextId: string, opt: Options): Promise<UserType | undefined> {
        try {
            const user = (await this.users(opt)).find((user) => user.id === personenKontextId)
            return user
        } catch (err) {
            throw err
        }
    }

    protected async groups(opt: Options): Promise<GroupType[]> {
        const { req } = opt

        try {
            const [response, response2] = await Promise.all([
                axios.get(SANIS_API_ENDPOINT + '/v1/personen', this.context.config),
                axios.get(SANIS_API_ENDPOINT + '/v1/gruppen', this.context.config),
                // Personenkontexte
                // axios.get(AS_API_ENDPOINT + '/v1/personenkontexte', this.context.config),
            ])

            const [personen, gruppen] = [response.data, response2.data]

            return gruppen.map(({ gruppe, gruppenzugehoerigkeiten }: any) => {
                const users: any[] = []

                if (gruppenzugehoerigkeiten) {
                    for (const gruppenzugehoerigkeit of gruppenzugehoerigkeiten) {
                        for (const person of personen) {
                            const { personenkontexte } = person
                            const found = personenkontexte?.find(({ id }: any) => id === gruppenzugehoerigkeit.ktid)
                            if (found) {
                                users.push(found.id)
                            }
                        }
                    }
                }

                return {
                    id: gruppe.id,
                    displayName: gruppe.bezeichnung,
                    users
                }
            })
        } catch (err) {
            throw err
        }

    }

    protected async users(opt: Options): Promise<UserType[]> {
        const { req } = opt

        try {
            const [response, response2, response3, response4, response5] = await Promise.all([
                axios.get(SANIS_API_ENDPOINT + '/v1/personen', this.context.config),
                axios.get(SANIS_API_ENDPOINT + '/v1/gruppen', this.context.config),
                axios.get(SANIS_API_ENDPOINT + '/v1/organisationen', this.context.config),
                axios.get(SANIS_API_ENDPOINT + `/v1/personenkontexte`, this.context.config),
                axios.get(SANIS_API_ENDPOINT + `/v1/gruppenzugehoerigkeiten`, this.context.config)
            ])

            const [sanisPersonen, sanisGruppen, sanisOrgs, personenkontexte, gruppenzugehoerigkeitenGr] = [response.data, response2.data, response3.data, response4.data, response5.data]

            let personen: any = []

            for (const persona of sanisPersonen) {
                let { person, personenkontexte } = persona
                let orgs: any[] = []
                let ktids: string[] = []

                if (personenkontexte) {
                    let allRoles: any[] = []
                    for (const personenkontext of personenkontexte) {
                        allRoles.push(personenkontext.rolle)
                        let groups: any[] = []

                        // Code     Bezeichnung
                        // Klasse  Schulklasse
                        // Kurs    Kurs/Unterrich
                        // Sonstig Sonstige Gruppe


                        let nutzerHatMehrereGrupppenZgehoerigkeiten = gruppenzugehoerigkeitenGr.filter(
                            ({ gruppenzugehoerigkeiten }: any) => gruppenzugehoerigkeiten.find(({ ktid }: any) => ktid === personenkontext.id)
                        )

                        for (const gruppenZugehoerigkeit of nutzerHatMehrereGrupppenZgehoerigkeiten) {
                            const sanisGruppe = sanisGruppen.find(({ gruppe }: any) => {
                                return gruppe.id === gruppenZugehoerigkeit.gruppe.id
                            })
                            const singleGruppenZeugehoerigkeit = gruppenZugehoerigkeit.gruppenzugehoerigkeiten[0]
                            const real_group = sanisGruppe.gruppe
                            groups.push(
                                {
                                    id: real_group.id,
                                    // gruppenZugehoerigkeit,
                                    orgid: real_group.orgid,
                                    type: real_group.typ,
                                    role: singleGruppenZeugehoerigkeit.rollen[0],
                                    displayName: real_group.bezeichnung,
                                }
                            )
                        }


                        // if (hatGruppenZugehoerigkeiten) {




                        // gruppenzugehoerigkeitenGr.forEach(({ gruppenzugehoerigkeiten, gruppe: sub_set_gruppe }: any) => {
                        //     const found = gruppenzugehoerigkeiten?.find(({ ktid }: any) => ktid === personenkontext.id)
                        //     if (found) {
                        //         const sanisGruppe = sanisGruppen.find(({ gruppe }: any) => {
                        //             return gruppe.id === sub_set_gruppe.id
                        //         })

                        //         const real_group = sanisGruppe.gruppe
                        //         allRoles = allRoles.concat(found.rollen)



                        //         groups.push(
                        //             {
                        //                 id: real_group.id,
                        //                 orgid: real_group.orgid,
                        //                 role: found.rollen[0],
                        //                 displayName: real_group.bezeichnung,
                        //             }
                        //         )
                        //     }
                        // })

                        const foundOrg = sanisOrgs.find((org: any) => org.id === personenkontext.organisation.id)
                        if (foundOrg) {
                            orgs.push({
                                [foundOrg.id]: {
                                    school_name: foundOrg.name,
                                    roles: allRoles
                                }
                            })
                        }

                        personen.push({
                            id: personenkontext.id,
                            email: `${person.name.vorname} ${person.name.familienname}`,
                            firstName: person.name.vorname,
                            lastName: person.name.familienname,
                            groups: groups,
                            orgs,
                            role: personenkontext.rolle
                        })
                    }
                }
            }
            return personen
        } catch (err) {
            throw err
        }
    }

    protected async group(id: string, opt: Options): Promise<GroupType> {
        try {
            const group = (await this.groups(opt)).find((group) => group.id === id)!
            return group
        } catch (err) {
            throw err
        }
    }

}