import { test, expect, type Page } from '@playwright/test';
import { createNode, getNode, pollGetNodeStatus, pollNodeApiTillNodeReady, unlockNode } from '../src/methods';
import { delay, invokeNodeApi, regtestApi } from '../src/utils';
import { updateEnvFile } from '../writeEnvFile';

// comand to run this test
//NODE_NAME=Node_B npx playwright test tests/api.node-run.test.ts   
//NODE_NAME=Node_A npx playwright test tests/api.node-run.test.ts   
//NODE_NAME=lsp_node npx playwright test tests/api.node-run.test.ts

const NODE_NAME = process.env.NODE_NAME;
const testNetwork = process.env.NETWORK;
const nodePassword = process.env.NODE_PASSWORD;

test.describe.serial('API Tests', () => {
    let nodeAId = '';
    let nodeA_BTCAddress = '';
    let nodeA_API = '';
 
    test.beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test.afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });
   
    test('Create Node', async ({ request }) => {
        const data = await createNode(request, NODE_NAME);
        expect(data.data.node).toBeDefined();
        expect(['IN_PROGRESS', 'RUNNING']).toContain(data.data.node.status);
        nodeAId = data.data.node.nodeId;
        await updateEnvFile(NODE_NAME, `${NODE_NAME}_ID`, nodeAId);
    });

    test('Wait till node Build will be finished', async ({ request }) => {
        const taskTimeout = 61000 * 10; // 10 minutes in milliseconds
        test.setTimeout(taskTimeout);// 5 minutes in milliseconds
        const timeout = 300000; // 5 minutes in milliseconds
        const interval = 30000; // Poll every 30 seconds
        const response = await pollGetNodeStatus(request, nodeAId, taskTimeout, interval);
        nodeA_API = response.data.invoke_url;
      
        expect(response.data.status).toBe('RUNNING');
    });

    test('Check if node is Ready', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const timeout = 300000; // 5 minutes in milliseconds
        const interval = 30000; // Poll every 30 seconds
        const res = await pollNodeApiTillNodeReady(request, nodeA_API, 'nodeinfo', timeout, interval);
        expect(await res.json()).toMatchObject({ error: 'Node is locked (hint: call unlock)', code: 403 });
        console.log(res);
    });
   
    test('Init node', async ({ request }) => {
        const res = await invokeNodeApi(request, nodeA_API, 'init', 'POST', { password: nodePassword});
        expect(await res.json()).toHaveProperty('mnemonic');
        console.log(res);
    });
   
    test('Unlock', async ({ request }) => {
        const { data } = await getNode(request, nodeAId);
        const { peerDNS, peerPort } = data;
        const peerUrl = `${peerDNS}:${peerPort}`;
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        try {
            const res = await unlockNode(request, nodeAId, { password: nodePassword, announce_addresses: [peerUrl], announce_alias: nodeAId, network:testNetwork ,node_endpoint:'https://node-api.thunderstack.org' });
            console.log(res);
        } catch (e) {
            console.log(e);
        }
        await delay(15000);
    });
   
    test('get BTC Address', async ({ request }) => {
        const res = await invokeNodeApi(request, nodeA_API, 'address', 'POST', {});
        const data = await res.json();
        expect(data).toHaveProperty('address');
        nodeA_BTCAddress = data.address;
        console.log(data);
    });
   
    test('Send BTC', async ({ request }) => {
        const res = await regtestApi(request, `sendtoaddress ${nodeA_BTCAddress} 10`);
        expect(res.ok()).toBeTruthy();
        await regtestApi(request, `mine 15`);
    });
    
    test('Get Balance', async ({ request }) => {
        const res = await invokeNodeApi(request, nodeA_API, 'btcbalance', 'POST', {
            "skip_sync": false
        });
        const data = await res.json();
        expect(data).toMatchObject({
            "vanilla": {
                "settled": 1000000000,
                "future": 1000000000,
                "spendable": 1000000000
            },
            "colored": {
                "settled": 0,
                "future": 0,
                "spendable": 0
            }
        });
    });

});
