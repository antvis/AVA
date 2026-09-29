FROM node:24.21.0-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ca-certificates bash \
    && rm -rf /var/lib/apt/lists/*

RUN python3 -m venv /opt/python \
    && /opt/python/bin/pip install --no-cache-dir pandas==2.3.3 pyarrow==21.0.0

ENV PATH="/opt/python/bin:${PATH}" HOME=/home/node TMPDIR=/tmp

WORKDIR /opt/ava
COPY package.json ./package.json
RUN npm install --omit=dev --ignore-scripts --registry=https://registry.npmjs.org

COPY lib ./lib
COPY esm ./esm
RUN chmod +x /opt/ava/lib/cli/index.js \
    && ln -s /opt/ava/lib/cli/index.js /usr/local/bin/ava \
    && mkdir -p /workspace/output \
    && chown -R node:node /workspace /home/node

WORKDIR /workspace
USER node
CMD ["sleep", "infinity"]
