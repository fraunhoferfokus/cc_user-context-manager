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
import { Handler } from "express";
const TOKEN_EXCHANGE_ENDPOINT = process.env.KEYCLOAK_EXCHANGE_TOKEN_ENDPOINT
const SANIS_USERINFO_ENDPOINT = process.env.SANIS_USERINFO_ENDPOINT
const SANIS_TOKEN_ENDPOINT = process.env.SANIS_TOKEN_ENDPOINT

export const verify_access_token: Handler = async (req, res, next) => {
    const access_token = req.headers.authorization?.split(' ')[1]
    if (access_token) req.session.access_token = access_token
    try {
        const keycloack_access_token = req.session.access_token
        const sanis_response = await axios.get(`${TOKEN_EXCHANGE_ENDPOINT}`, {
            headers: {
                Authorization: `Bearer ${keycloack_access_token}`
            }
        })
        const sanis_access_token = sanis_response.data.access_token
        const sanis_refresh_token = sanis_response.data.refresh_token
        req.session.sanis_refresh_token = sanis_refresh_token
        const sanis_user_resp = await axios.get(`${SANIS_USERINFO_ENDPOINT}`, {
            headers: {
                Authorization: `Bearer ${sanis_access_token}`
            }
        })
        req.session.user = sanis_user_resp.data
        return next()
    } catch (err: any) {
        // if response status of err is 401, then try refresh token
        if (err.response?.status === 401 || err.response?.status === 400) {
            try {
                const refresh_token = req.session.sanis_refresh_token
                // get new access token from refresh token
                const sanis_resp = await axios.post(`${SANIS_TOKEN_ENDPOINT}`, {
                    grant_type: 'refresh_token',
                    client_id: process.env.SANIS_CLIENT_ID,
                    client_secret: process.env.SANIS_CLIENT_SECRET,
                    refresh_token
                },
                    {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        }
                    }
                )

                const sanis_access_token = sanis_resp.data.access_token
                const sanis_user_resp = await axios.get(`${SANIS_USERINFO_ENDPOINT}`, {
                    headers: {
                        Authorization: `Bearer ${sanis_access_token}`
                    }
                })
                req.session.user = sanis_user_resp.data
                return next()
            } catch (err: any) {
                if (access_token) return res.status(err?.response?.status || 500).json({ status: err?.response?.status, message: err?.response?.data })
            }
        }

        return next(err)
    }

    return res.status(403).send('Not session available')

}
