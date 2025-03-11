import { auth, cloudApi } from "./constants";
import { invokeNodeApi } from "./utils";


export const pollGetNodeStatus = async (request, nodeId, timeout, interval) => {
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
        const response = await getNode(request, nodeId);
        const status = response.data.status;
        if (status === 'RUNNING' || status === 'DESTROYED') {
            const health = await healthCheck(request, nodeId);
            const { peerDNS, peerPort } = response.data;
            if (peerDNS && peerPort) {
                return response;
            }
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Node status did not change to 'RUNNING' or 'DESTROYED' within ${timeout}ms`);
};
export const createNode = async (request, name) => {
    const response = await request.post(cloudApi + '/nodes', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },
        data: {
            name: name,
            network: 'regtest',
        },
    });
    const data = await response.json();
    console.log(data);
    return data;
};
export const pollNodeApiTillNodeReady = async (request, nodeApi, route, timeout, interval) => {
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
        // try {
        const response = await invokeNodeApi(request, nodeApi, route);
        console.log(response.status());
        if (response.status() !== 500) {
            return response;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Node API did not return status 200 within ${timeout}ms`);
};

export const getNode = async (request, nodeId) => {
    const response = await request.get(cloudApi + '/nodes/' + nodeId, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },
    });
    const data = await response.json();
    return data;
};
export const healthCheck = async (request, nodeId) => {
    const response = await request.get(`${cloudApi}/nodes/${nodeId}/health`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },
    });
    const data = await response.json();
    return data;
};

export const destroyNode = async (request, nodeId) => {
    const response = await request.delete(cloudApi + '/nodes', {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth}`,
        },
        data: {
            destroyNodeId: nodeId,
        },
    });
    const data = await response.json();
    return data;
};
// const listNodes = async (request) => {
//     const response = await request.get(cloudApi + '/nodes', {
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': auth,
//         },
//     });
//     const data = await response.json();
//     return data;
// };
export const buildOpenChannelPayload = ({ peer_pubkey_and_opt_addr, asset_amount, asset_id }: any, temporary_channel_id: string): any => {
    return {
        capacity_sat: 30010,
        push_msat: 0,// default value
        public: true,// default value
        with_anchors: true,// default value
        fee_base_msat: 1000,// default value
        fee_proportional_millionths: 0, // default value
        peer_pubkey_and_opt_addr: peer_pubkey_and_opt_addr,
        temporary_channel_id,
        ...(asset_amount && asset_id && {
            asset_amount: asset_amount,
            asset_id: asset_id,
        }),
    };
}
