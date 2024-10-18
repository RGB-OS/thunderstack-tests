import { test, expect, type Page } from '@playwright/test';
import { buildOpenChannelPayload, getNode, pollNodeApiTillNodeReady } from '../src/methods';
import crypto from 'crypto';
import { delay, invokeNodeApi, regtestApi } from '../src/utils';
// comand to run this test

// NODE_NAME_A='Node_A' NODE_NAME_B='Node_B' npx playwright test tests/api.node-closechannel.test.ts


const NODE_NAME_A = process.env.NODE_NAME_A;
const NODE_NAME_B = process.env.NODE_NAME_B;

const NODE_A_ID = process.env[`${NODE_NAME_A}_ID`];
const NODE_B_ID = process.env[`${NODE_NAME_B}_ID`];;

test.describe.serial('Close Channel Tests', () => {
    test.beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test.afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });
    test('Channel Exist /listchannel', async ({ request }) => {

        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        console.log('NODE_A_ID', NODE_A_ID);
        const { data } = await getNode(request, NODE_A_ID);
        const { invoke_url } = data;
        const channelRes = await invokeNodeApi(request, invoke_url, 'listchannels', 'GET');
        const channelData = await channelRes.json();
        expect(channelData).toBeDefined();
        expect(channelData).toHaveProperty('channels');
        expect(channelData.channels.length).toBeGreaterThan(0);

        const { channel_id, peer_pubkey } = channelData.channels[0];

        const closeChannelRes = await invokeNodeApi(request, invoke_url, 'closechannel', 'POST', { channel_id, peer_pubkey, force: true });
        await regtestApi(request, `mine 101`);
        expect(closeChannelRes.ok()).toBeTruthy();

    });


    test('Check if /listchannel is empty', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const { data } = await getNode(request, NODE_A_ID);
        const { invoke_url } = data;
        const channelRes = await invokeNodeApi(request, invoke_url, 'listchannels', 'GET');
        const channelData = await channelRes.json();
        expect(channelData).toBeDefined();
        expect(channelData).toHaveProperty('channels');
        expect(channelData.channels.length).toBe(0);
    });
    test('Refresh payments', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const { data } = await getNode(request, NODE_A_ID);
        const { data: dataB } = await getNode(request, NODE_B_ID);
        const { invoke_url } = data;
        const { invoke_url: invoke_urlB } = dataB;
        // await invokeNodeApi(request, invoke_url, 'refreshtransfers', 'POST', {
        //     "skip_sync": false
        // });
        // await regtestApi(request, `mine 50`);
        // await delay(10000);
        // await invokeNodeApi(request, invoke_urlB, 'refreshtransfers', 'POST', {
        //     "skip_sync": false
        // });
        // await delay(10000);
        // await regtestApi(request, `mine 50`);
        // await delay(10000);
        // await invokeNodeApi(request, invoke_url, 'refreshtransfers', 'POST', {
        //     "skip_sync": false
        // });
        // await regtestApi(request, `mine 50`);
        // await delay(10000);
        // await invokeNodeApi(request, invoke_urlB, 'refreshtransfers', 'POST', {
        //     "skip_sync": false
        // });
        // await regtestApi(request, `mine 50`);
        // await delay(10000);

        const channelRes = await invokeNodeApi(request, invoke_url, 'listpayments', 'GET');
        const channelData = await channelRes.json();
        expect(channelData).toBeDefined();

    });


});
