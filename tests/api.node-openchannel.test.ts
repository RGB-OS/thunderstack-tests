import { test, expect, type Page } from '@playwright/test';
import { buildOpenChannelPayload, getNode, pollNodeApiTillNodeReady } from '../src/methods';
import crypto from 'crypto';
import { delay, invokeNodeApi, regtestApi } from '../src/utils';
// comand to run this test

// NODE_NAME_A='Node_A' NODE_NAME_B='Node_B' npx playwright test tests/api.node-openchannel.test.ts


const NODE_NAME_A = process.env.NODE_NAME_A;
const NODE_NAME_B = process.env.NODE_NAME_B;

const NODE_A_ID = process.env[`${NODE_NAME_A}_ID`];
const NODE_B_ID = process.env[`${NODE_NAME_B}_ID`];;

test.describe.serial('Open Channel Tests', () => {
    test.beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test.afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
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

    test('Open BTC Channel None A to B', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds

        // NODE B chanel Payload
        const { data } = await getNode(request, NODE_B_ID);
        const { peerDNS, peerPort, invoke_url } = data;
        const nodeRes = await invokeNodeApi(request, invoke_url, 'nodeinfo', 'GET');
        const { pubkey } = await nodeRes.json();
        const peer_pubkey_and_opt_addr = `${pubkey}@${peerDNS}:${peerPort}`;
        const temporary_channel_id = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
        const payload = buildOpenChannelPayload({ peer_pubkey_and_opt_addr:pubkey }, temporary_channel_id)

        // NODE A request
        const { data: dataA } = await getNode(request, NODE_A_ID);
        const { invoke_url: invoke_urlA } = dataA;
        const channelRes = await invokeNodeApi(request, invoke_urlA, 'openchannel', 'POST', payload);
        const channelDataA = await channelRes.json();
        await delay(10000);
        
        // Mine a block
        await regtestApi(request, `mine 101`);
        expect(channelDataA).toHaveProperty('temporary_channel_id');

        // expect(data.status).toBe('RUNNING');
    });

    test('Channel Exist /listchannel', async ({ request }) => { 
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const { data } = await getNode(request, NODE_A_ID);
        const { invoke_url } = data;
        const channelRes = await invokeNodeApi(request, invoke_url, 'listchannels', 'GET');
        const channelData = await channelRes.json();
        expect(channelData).toBeDefined();
        expect(channelData).toHaveProperty('channels');
        expect(channelData.channels.length).toBeGreaterThan(0);
    });

});
