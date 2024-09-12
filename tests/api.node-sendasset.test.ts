import { test, expect, type Page } from '@playwright/test';
import { getNode } from '../src/methods';
import { invokeNodeApi, regtestApi } from '../src/utils';
// comand to run this test
//  NODE_NAME_A='' NODE_NAME_B=''  npx playwright test tests/api.node-sendasset.test.ts
const EXPIRE_ORDER_SECONDS = 3600;// 1 hour

const NODE_NAME_A = process.env.NODE_NAME_A;
const NODE_NAME_B = process.env.NODE_NAME_B;

const NODE_A_ID = process.env[`${NODE_NAME_A}_ID`];
const NODE_B_ID = process.env[`${NODE_NAME_B}_ID`];
const ASSET_ID = process.env[`${NODE_NAME_A}_ASSET_ID`];

test.describe.serial('Send Asset', () => {

    let rgbInvoice;
    let nodeA_API = '';
    let nodeB_API = '';

    test.beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test.afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });
    test('GET Nodes Info', async ({ request }) => {
        const { data: dataA } = await getNode(request, NODE_A_ID);
        const { invoke_url: invoke_urlA } = dataA;
        nodeA_API = invoke_urlA;

        const { data: dataB } = await getNode(request, NODE_B_ID);
        const { invoke_url: invoke_urlB } = dataB;
        nodeB_API = invoke_urlB;
    });

    test('Node B RGB /rgbinvoice', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds

        const invoiceRes = await invokeNodeApi(request, nodeB_API, 'rgbinvoice', 'POST', {
            "min_confirmations": 1,
            "asset_id": ASSET_ID,
        });
        // Mine a block
        await regtestApi(request, `mine 101`);
        const invoiceData = await invoiceRes.json();
        expect(invoiceData).toHaveProperty('invoice');
        rgbInvoice = invoiceData;
    });

    test('Node A /sendasset', async ({ request }) => {
        test.setTimeout(61000);// 5 minutes in milliseconds

        const decodedRes = await invokeNodeApi(request, nodeA_API, 'decodergbinvoice', 'POST', { invoice: rgbInvoice.invoice });
        const decodedData = await decodedRes.json();
        const invoicePayload = {
            ...decodedData,
            "donation": false,
            "min_confirmations": 1,
        }
        const paymentRes = await invokeNodeApi(request, nodeA_API, 'sendasset', 'POST', invoicePayload);
        const paymentData = await paymentRes.json();
        // Mine a block
        await regtestApi(request, `mine 101`);
        console.log(paymentData);
    });

    test('Node A /refreshtransfers', async ({ request }) => {
        test.setTimeout(61000);// 5 minutes in milliseconds

        const res = await invokeNodeApi(request, nodeA_API, 'refreshtransfers', 'POST');
        expect(res.ok()).toBeTruthy();

        // Mine a block
        await regtestApi(request, `mine 10`);

    });

});