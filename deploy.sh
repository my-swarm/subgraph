#!/usr/bin/env bash

GRAPH_NAME="my-swarm/issuance"
if [ "$1" == "kovan" ]; then
        GRAPH_NAME="my-swarm/issuance-kovan"
fi

graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ $GRAPH_NAME --access-token $(cat .access-token)
