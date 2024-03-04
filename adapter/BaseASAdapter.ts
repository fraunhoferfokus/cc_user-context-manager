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
import { GroupType } from "../models/GroupType"
import { UserType } from "../models/UserType"


export type Options = {
    req?: Express.Request,
    res?: Express.Response,
}



export abstract class BaseASAdapter {
    context: { [key: string]: any } = {
        expires_in: new Date(),
        org: undefined,
    }

    protected configureContext?(options: any): Promise<any>
    protected userContext?(): Promise<any>
    protected groupContext?(): Promise<any>
    protected usersContext?(): Promise<any>
    protected groupsContext?(): Promise<any>
    
    public async getUsers(opt?: Options) {
        if (this.configureContext) await this.configureContext(opt)
        if (this.usersContext) await this.usersContext()
        return this.users(opt)
    }

    public async getUser(id?: string, opt?: Options) {
        if (this.configureContext) await this.configureContext(opt)
        if (this.userContext) await this.userContext()
        return this.user(id, opt)
    }

    public async getGroups(opt?: Options) {
        if (this.configureContext) await this.configureContext(opt)
        if (this.groupsContext) await this.groupsContext()
        return this.groups(opt)
    }

    public async getGroup(id?: string, opt?: Options) {
        if (this.configureContext) await this.configureContext(opt)
        if (this.groupContext) await this.groupContext()
        return this.group(id, opt)
    }
    protected abstract user(id?: string, opt?: Options): Promise<UserType | undefined>
    protected abstract groups(opt?: Options): Promise<GroupType[]>
    protected abstract users(opt?: Options): Promise<UserType[]>
    protected abstract group(id?: string, opt?: Options): Promise<GroupType | undefined>
}