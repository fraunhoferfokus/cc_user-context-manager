**This project incorporates elements from the open-source project [CLM](https://github.com/fraunhoferfokus/clm-core) to facilitate its functionality.**

**This microservice is based upon [license-core](https://github.com/fraunhoferfokus/cc_license-core) and extends the basic functionalities with additional features.**

# CC-USER-CONTEXT-MANAGER
This service facilitates the real-time retrieval of comprehensive context information about users—including their group affiliations, roles, and organizational memberships—directly from the login server during the license assignment process. This capability enables the precise allocation of licenses to users, tailored according to a spectrum of organizational attributes.

As of now, the only supported Authentication Server (AS) for this process is moin.schule.

# Requirements:
* MariaDB Version 10x
* Redis Version 6x
* Node.js Version 20x
* [moin.schule](https://www.n-21.de/portal/seiten/moin-schule-900000111-10056.html) (OIDC) authentication service credentials 

# Quick Start:


Install node_modules in the respective git submodules with their respective dependencies by running: 

```npm install```

It is also necessary to copy .env.default file to .env and insert the appropriate values. Please contact the owner of this repository to the values. A description of the values is also given in the file itself.

(UNIX)
```cp .env.default .env```

| Name                               | Example | Required (Yes/No) | Description                                                                                   |
|------------------------------------|---------|-------------------|-----------------------------------------------------------------------------------------------|
| `PORT`                             |         | Yes               | The port on which the service should be deployed.                                             |
| `OIDC_PROVIDER`                    |         | Yes               | The URL of the OIDC Provider for authentication services.                                     |
| `KEYCLOAK_CLIENT_ID`               |         | Yes               | The client ID for Keycloak authentication, necessary for integration with Keycloak.           |
| `REDIS_URL`                        |         | Yes               | The connection string for Redis, including password and port, used for caching and sessions.  |
| `MARIA_CONFIG`                     |         | Yes               | MariaDB configuration details: host, port, database, username, and password.                  |
| `SANIS_ORGS`                       |         | Yes                | Identifiers for organizations within SANIS (now referred to as moin.schule).                  |
| `SANIS_API_ENDPOINT`               |         | Yes               | The base API endpoint for SANIS (now referred to as moin.schule).                             |
| `SANIS_CLIENT_ID`                  |         | Yes               | The client ID for SANIS (now referred to as moin.schule), if applicable.                      |
| `SANIS_CLIENT_SECRET`              |         | Yes               | The client secret for SANIS (now referred to as moin.schule).                                 |
| `SANIS_TOKEN_ENDPOINT`             |         | Yes               | The token endpoint for SANIS (now referred to as moin.schule).                                |
| `SANIS_USERINFO_ENDPOINT`          |         | Yes               | The user info endpoint for SANIS (now referred to as moin.schule).                            |
| `KEYCLOAK_EXCHANGE_TOKEN_ENDPOINT` |         | Yes               | The token exchange endpoint for Keycloak, used for obtaining tokens with different scopes.    |





Afterward just startup the server with following command:

```npm run dev```

# Structure
The project follows following structure:

├── adapter/ / #  Contains adapter functionality to map the specifications of the authentication service to internal user/context information. 

├── server.ts / # Serves as the project's entry point, where all routes are defined. 

├── models/ # Holds the Data Access Objects (DAOs) for interacting with the persistence layers.

├── controllers / # Contains the business logic for the REST endpoints.

├── middlewares / # Comprises interceptors for Express routes.

└── README.md # The file you're reading now


### Changelog

The changelog can be found in the [CHANGELOG.md](CHANGELOG.md) file.

## Get in touch with a developer

Please see the file [AUTHORS.md](AUTHORS.md) to get in touch with the authors of this project.
We will be happy to answer your questions at {clm@fokus.fraunhofer.de}

## License


The project is made available under the license in the file [LICENSE.txt](license.txt)