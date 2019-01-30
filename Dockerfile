FROM concourse/git-resource
RUN mv /opt/resource /opt/git-resource
RUN apk add --no-cache nodejs
COPY ./dist/ /opt/resource/js/
RUN echo -e "#!/bin/sh\nnode /opt/resource/js/index.js check" > /opt/resource/check && \
echo -e "#!/bin/sh\nnode /opt/resource/js/index.js in \$1" > /opt/resource/in && \
echo -e "#!/bin/sh\nnode /opt/resource/js/index.js out \$1" > /opt/resource/out && \
chmod +x /opt/resource/check /opt/resource/in /opt/resource/out
