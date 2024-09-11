

// import axios from 'axios'
// axiosInstance
const cloudApi = 'https://cloud-api.test.thunderstack.org/api/';
const cognitoToken = process.env.REACT_APP_TEST_TOKEN;
const nodeApi = process.env.REACT_APP_TEST_NODE_API || 'https://node-api.thunderstack.org';
const auth = process.env.REACT_APP_TEST_TOKEN 
console.log(cloudApi);
const listNodes = async () => {
    const response = await fetch(cloudApi + '/nodes', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },

    });
    const data = await response.json();
    return data;
}
const createNode = async (name: string) => {
    const response = await fetch(cloudApi + '/nodes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },
        body: JSON.stringify({
            name: name,
        }),
    });
    const data = await response.json();
    return data;
}

const getNode = async (nodeId: string) => {
    const response = await fetch(cloudApi + '/nodes/' + nodeId, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },
    });
    const data = await response.json();
    return data;
}


const destroyNode = async (nodeId: string) => {
    const response = await fetch(cloudApi + '/nodes', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth,
        },
        body: JSON.stringify({
            destroyNodeId: nodeId,
        }),
    });
    const data = await response.json();
    return data;
}
const invokeNodeApi = async (nodeApi: string, route: string, method = 'GET', body: any = {}) => {
 
    const userIdNodeIdPath = nodeApi.split('/nodes')[1];
    console.log(userIdNodeIdPath);
    const url = `https://node-api.thunderstack.org${userIdNodeIdPath}${route}`;
   const api = createAxiosInstance(url, auth);
    const response = await api.request({
        url:url,
        method: method,
        headers: {
           'Content-Type': 'application/json',
            // 'Access-Control-Allow-Origin': '*',
            'Authorization': auth,
        },
        data: method !== 'GET' ? body : undefined,
    });
    // const data = await response.json();
    console.log(response);
    return response;
}

const pollNodeApiTillNodeReady = async (nodeApi: string, route: string, timeout: number, interval: number) => {
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
        try{
        const response = await invokeNodeApi(nodeApi, route);
        return response;
        }catch(err){
           
            console.log(err);
            return err;
            // if(err.code === 403){
            //     return err;       
            // }
        }
        // if (response.status !== 500) {
        //     return response;
        // }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Node API did not return status 200 within ${timeout}ms`);
}
const pollGetNodeStatus = async (nodeId: string, timeout: number, interval: number) => {
    const endTime = Date.now() + timeout;

    while (Date.now() < endTime) {
        const response = await getNode(nodeId);
        const status = response.data.status;
        if (status === 'RUNNING' || status === 'DESTROYED') {
            return response;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Node status did not change to 'RUNNING' or 'DESTROYED' within ${timeout}ms`);
};



describe('API Tests', () => {
    jest.setTimeout(1 * 60 * 1000);
    let nodeAId = '113718d49d6b4123bf5735a72375f2c7';
    let nodeA_API = '';
    // it('Fetch a list of nodes', async () => {
    //     jest.setTimeout(10000);
    //     // Create a node
    //     console.log('Creating a node', auth);
    //     const data = await listNodes();
    //     console.log(data);
    //     expect(data.data.nodes).toBeDefined();
    // });

    // it('Create a node', async () => {
    //     jest.setTimeout(300000);
    //     // Create a node
    //     const data = await createNode('Node A');
    //     console.log(data);
    //     expect(data.data.node).toBeDefined();
    //     expect(data.data.node.status).toBe('IN_PROGRESS');
    //     nodeAId = data.data.node.nodeId;
    // });

    it('Get a node', async () => {
        jest.setTimeout(10000);
        // Create a node
        const data = await getNode(nodeAId);
        console.log(data);
        nodeA_API = data.data.invoke_url;
        expect(data.data).toBeDefined();
        expect(data.data.status).toBe('IN_PROGRESS');
    });
    it('Wait till node Build will be finished', async () => {
        jest.setTimeout(31000);
        const timeout = 300000; // 5 minutes in milliseconds
        const interval = 5000; // Poll every 5 seconds
        const response = await pollGetNodeStatus(nodeAId, timeout, interval);
        console.log(response);
        expect(response.data.status).toBe('RUNNING');
    });
    it('Check if node is Ready', async () => {
        jest.setTimeout(1 * 60 * 1000);
        const timeout = 300000; // 5 minutes in milliseconds
        const interval = 30000; // Poll every 30 seconds
        const res = await pollNodeApiTillNodeReady(nodeA_API, 'nodeinfo', timeout, interval);
        console.log(res);
    });

    // it('Destroy a node', async () => {
    //     jest.setTimeout(10000);
    //     // Create a node
    //     const data = await destroyNode(nodeAId);
    //     console.log(data);
    //     expect(data.data.node).toBeDefined();
    //     expect(data.data.node.status).toBe('IN_PROGRESS');
    // });
});