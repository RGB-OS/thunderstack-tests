import { test, expect, type Page } from '@playwright/test';
import { buildOpenChannelPayload, getNode, pollNodeApiTillNodeReady } from '../src/methods';
import crypto from 'crypto';
import { delay, invokeNodeApi, regtestApi } from '../src/utils';
import { updateEnvFile } from '../writeEnvFile';
// comand to run this test
// NODE_NAME=Node_A npx playwright test tests/api.node-issueasset.test.ts


const NODE_NAME = process.env.NODE_NAME;
const NODE_ID = process.env[`${NODE_NAME}_ID`];

test.describe.serial('Create Asset', () => {
    const assetAmount = 1000;
    const assetName = 'USDT';
    let asset_id = '';
    let nodeApi = '';
    test.beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test.afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test('get Node', async ({ request }) => {

        const { data } = await getNode(request, NODE_ID);
        const { invoke_url } = data;
        nodeApi = invoke_url;
    });

    test('call if /createutxos', async ({ request }) => {
        test.setTimeout(61000);// 5 minutes in milliseconds
        const res = await invokeNodeApi(request, nodeApi, 'createutxos', 'post', {
            "up_to": false,
            "num": 10,
            "size": 32500,
            "fee_rate": 5,
            "skip_sync": false
        });
        expect(res.ok()).toBeTruthy();
        await regtestApi(request, `mine 30`);
    });

    test('call if /issueassetnia', async ({ request }) => {
        test.setTimeout(61000);// 5 minutes in milliseconds
        const res = await invokeNodeApi(request, nodeApi, 'issueassetnia', 'post', {
            "amounts": [
                assetAmount
            ],
            "ticker": assetName,
            "name": assetName,
            "precision": 0
        });
        const data = await res.json();
        expect(data).toHaveProperty('asset');
        asset_id = data.asset.asset_id;
        await updateEnvFile(NODE_NAME, `${NODE_NAME}_ASSET_ID`, asset_id);
        expect(res.ok()).toBeTruthy();
        await regtestApi(request, `mine 30`);
    });

    test('call if /assetbalance', async ({ request }) => {
        test.setTimeout(61000);
        const res = await invokeNodeApi(request, nodeApi, 'assetbalance', 'post', {
            "asset_id": asset_id
        });
        const data = await res.json();
        expect(data).toHaveProperty('settled');
        expect(data.settled).toBeGreaterThanOrEqual(assetAmount);

    });

});