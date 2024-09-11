import { test, expect, type Page } from '@playwright/test';
import { createNode, pollGetNodeStatus, pollNodeApiTillNodeReady } from '../src/methods';
import { delay, invokeNodeApi, regtestApi } from '../src/utils';
// NODE_NAME=Node_B npx playwright test tests/api.node-run.test.ts   
const NODE_NAME = process.env.NODE_NAME;
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
    });
    // test('Get a node', async ({ request }) => {
    //     const data = await getNode(request, nodeAId);
    //     console.log(data);
    //     // console.log(data.data.invoke_url);

    //     expect(data.data).toBeDefined();
    //     expect(['IN_PROGRESS', 'RUNNING']).toContain(data.data.status);
    // });

    test('Wait till node Build will be finished', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const timeout = 300000; // 5 minutes in milliseconds
        const interval = 30000; // Poll every 30 seconds
        const response = await pollGetNodeStatus(request, nodeAId, timeout, interval);
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
        const res = await invokeNodeApi(request, nodeA_API, 'init', 'POST', { password: '12345678' });
        expect(await res.json()).toHaveProperty('mnemonic');
        console.log(res);
    });
    test('Unlock', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        try {
            const res = await invokeNodeApi(request, nodeA_API, 'unlock', 'POST', { password: '12345678' });
            console.log(res);
        } catch (e) {
            console.log(e);
        }
        await delay(15000);
        //expect(res.ok()).toBeTruthy();
        // console.log(res);
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
        const res = await invokeNodeApi(request, nodeA_API, 'btcbalance', 'GET', {});
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

    // test('Destroy Node', async ({ request }) => {
    //     const data = await destroyNode(request, nodeAId);
    //     console.log(data);
    //     expect(data.data).toBeDefined();
    //     expect(data.data.status).toBe('DESTROYED');
    // })
});
