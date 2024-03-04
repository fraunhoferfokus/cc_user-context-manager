FROM node:20.5.1-slim

COPY . /usr/src/app

# Setting permissions for /usr/src/app
RUN chgrp -R 0 /usr/src/app && \
    chmod -R g=u /usr/src/app 


WORKDIR /usr/src/app

# Ensure npm uses /.npm as cache
RUN npm config set cache /.npm --global

RUN npm i

# Adjust permissions again, especially for the npm cache directory
RUN chgrp -R 0 /.npm && \
    chmod -R g=u /.npm

RUN npm install -g typescript

CMD [ "npm", "start" ]




