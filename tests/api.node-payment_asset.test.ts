import { test, expect, type Page } from '@playwright/test';
import { getNode } from '../src/methods';
import { delay, invokeNodeApi, regtestApi } from '../src/utils';
// comand to run this test
// NODE_NAME_A='Node_A' NODE_NAME_B='Node_B' npx playwright test tests/api.node-payment_asset.test.ts
const EXPIRE_ORDER_SECONDS = 1800;// 1 hour

const NODE_NAME_A = process.env.NODE_NAME_A;
const NODE_NAME_B = process.env.NODE_NAME_B;

const NODE_A_ID = process.env[`${NODE_NAME_A}_ID`];
const NODE_B_ID = process.env[`${NODE_NAME_B}_ID`];

const ASSET_ID = process.env[`${NODE_NAME_A}_ASSET_ID`];
const asset_amount = 100;
console.log('NODE_A_ID',NODE_A_ID);
console.log('NODE_B_ID',NODE_B_ID);
test.describe.serial('/LnInvoice & /Payment', () => {

    let lninvoice = '';

    test.beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test.afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test('Node B Create Invoice', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const { data } = await getNode(request, NODE_B_ID);
        const { invoke_url } = data;
        const invoiceRes = await invokeNodeApi(request, invoke_url, 'lninvoice', 'POST',{
            amt_msat: 3000000,
            expiry_sec: EXPIRE_ORDER_SECONDS,
            asset_id: ASSET_ID,
            asset_amount: asset_amount,
        });
         // Mine a block
         await regtestApi(request, `mine 101`);
         await delay(10000);
        const invoiceData = await invoiceRes.json();
        expect(invoiceData).toHaveProperty('invoice');
        lninvoice = invoiceData.invoice;
    });

    test('Node A Pay Invoice', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const { data } = await getNode(request, NODE_A_ID);
        const { invoke_url } = data;
        const paymentRes = await invokeNodeApi(request, invoke_url, 'sendpayment', 'POST', { invoice: lninvoice });
        const paymentData = await paymentRes.json();
         // Mine a block
         await regtestApi(request, `mine 101`);
        // console.log(paymentData);
    });

    test('Payments', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const { data } = await getNode(request, NODE_A_ID);
        const { invoke_url } = data;
        const paymentRes = await invokeNodeApi(request, invoke_url, 'listpayments', 'GET');
        const paymentData = await paymentRes.json();
         // Mine a block
        //  await regtestApi(request, `mine 101`);
        // console.log(paymentData);
    });

});