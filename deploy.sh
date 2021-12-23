#!/usr/bin/env bash

GRAPH_NAME="my-swarm/issuance"
if [ "$1" == "kovan" ]; then
        GRAPH_NAME="my-swarm/issuance-kovan"
fi
if [ "$1" == "mumbai" ]; then
        GRAPH_NAME="my-swarm/issuance-mumbai"
fi
if [ "$1" == "polygon" ]; then
        GRAPH_NAME="my-swarm/issuance-polygon"
fi

graph deploy --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/ $GRAPH_NAME --access-token $(cat .access-token)
