import { test, expect, type Page } from '@playwright/test';
import { delay, invokeLSPApi, invokeNodeApi, regtestApi } from '../src/utils';
import { buildOpenChannelPayload, getNode } from '../src/methods';
import crypto from 'crypto';

//NODE_NAME_A='Node_A' NODE_NAME_B='Node_B' npx playwright test tests/api.lsp-btc.test.ts

const NODE_LSP = process.env.NODE_NAME_LSP;
const NODE_CLIENT_A = process.env.NODE_NAME_A;
const NODE_CLIENT_B = process.env.NODE_NAME_B;

const NODE_LSP_ID = process.env[`${NODE_LSP}_ID`];
const NODE_CLIENT_A_ID = process.env[`${NODE_CLIENT_A}_ID`];
const NODE_CLIENT_B_ID = process.env[`${NODE_CLIENT_B}_ID`];

test.describe.serial('LSP Tests', () => {
    let LSP_ConnectPeerUrl = '';
    let Client_Node_B_ConnectPeerUrl = '';
    let channel_expiry_blocks = 0;
    let Node_A_invoke_url = '';
    let Node_A_payment_hash = '';
    let order_id = '';
    let ln_invoice = '';
    let ln_asset_invoice = '';

    test('Getting LSP info - /get_info', async ({ request }) => {
        test.setTimeout(61000);// 5 minutes in milliseconds
        const lspInfoRes = await invokeLSPApi(request, 'get_info', 'GET');
        const infoData = await lspInfoRes.json();
        expect(infoData).toBeDefined();
        expect(typeof infoData).toBe('object');

        // Check if all required fields exist
        expect(infoData).toHaveProperty('max_channel_expiry_blocks');
        expect(infoData).toHaveProperty('min_initial_lsp_balance_sat');
        expect(infoData).toHaveProperty('max_initial_lsp_balance_sat');
        expect(infoData).toHaveProperty('min_channel_balance_sat');
        expect(infoData).toHaveProperty('max_channel_balance_sat');
        expect(infoData).toHaveProperty('lsp_assets');
        expect(infoData).toHaveProperty('uris');

        // Check that 'uris' is an array and its length is greater than 0
        expect(Array.isArray(infoData.uris)).toBe(true);
        expect(infoData.uris.length).toBeGreaterThan(0);
        LSP_ConnectPeerUrl = infoData.uris[0];
        channel_expiry_blocks = infoData.max_channel_expiry_blocks;

         // get client node B connect peer url
         console.log('NODE_CLIENT_B_ID',NODE_CLIENT_B_ID);
         const { data: clientNode } = await getNode(request, NODE_CLIENT_B_ID);
         
         const {peerDNS, peerPort,invoke_url} = clientNode;
         const nodeRes = await invokeNodeApi(request, invoke_url, 'nodeinfo', 'GET');
         const { pubkey } = await nodeRes.json();
         Client_Node_B_ConnectPeerUrl = `${pubkey}@${peerDNS}:${peerPort}`;
        
    });
    

    test('Create LSP order - /create_order', async ({ request }) => {
        test.setTimeout(61000);
        const newOrderRes = await invokeLSPApi(request, 'create_order', 'POST', { lsp_balance_sat: 100000, channel_expiry_blocks,public_key: Client_Node_B_ConnectPeerUrl });
        const newOrderData = await newOrderRes.json();
        expect(newOrderData).toBeDefined();
        expect(typeof newOrderData).toBe('object');
        expect(newOrderData).toHaveProperty('order_id');
        expect(newOrderData).toHaveProperty('status');
        expect(newOrderData.status).toBe('Pending');
        expect(newOrderData.channel).toBe(null);

        expect(newOrderData).toHaveProperty('payment');
        expect(newOrderData.payment).toHaveProperty('ln');
        expect(newOrderData.payment.ln).toHaveProperty('invoice');
        expect(newOrderData.payment.ln).toHaveProperty('status');
        expect(newOrderData.payment.ln.invoice).not.toBe('');

        expect(newOrderData.payment).toHaveProperty('ln_asset');
        expect(newOrderData.payment.ln_asset).toHaveProperty('invoice');
        expect(newOrderData.payment.ln_asset).toHaveProperty('status');
        expect(newOrderData.payment.ln_asset.invoice).not.toBe('');

        order_id = newOrderData.order_id;
        ln_invoice = newOrderData.payment.ln.invoice;
        ln_asset_invoice = newOrderData.payment.ln_asset.invoice;

    });


    test('Node A Creates channel to LSP', async ({ request }) => {
        test.setTimeout(61000 * 5);
        // NODE B chanel Payload

        const temporary_channel_id = crypto.createHash('sha256').update(crypto.randomBytes(32)).digest('hex');
        const payload = buildOpenChannelPayload({ peer_pubkey_and_opt_addr: LSP_ConnectPeerUrl }, temporary_channel_id)

        // NODE A request
        const { data: dataA } = await getNode(request, NODE_CLIENT_A_ID);
        Node_A_invoke_url = dataA.invoke_url;
        const channelRes = await invokeNodeApi(request, Node_A_invoke_url, 'openchannel', 'POST', payload);
        const channelDataA = await channelRes.json();
        await delay(10000);

        // Mine a block
        await regtestApi(request, `mine 101`);
        expect(channelDataA).toHaveProperty('temporary_channel_id');
        await delay(50000);

    });

    test('Check if Node A opened channel /listchannel', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const newChannelRes = await invokeNodeApi(request, Node_A_invoke_url, 'listchannels', 'GET');
        const newChannelData = await newChannelRes.json();
        expect(newChannelData).toBeDefined();
        expect(newChannelData).toHaveProperty('channels');
        expect(newChannelData.channels.length).toBeGreaterThan(0);
    })

    test('Node A Pays LSP LN invoice', async ({ request }) => {
        test.setTimeout(61000 * 5);
        
        const paymentRes = await invokeNodeApi(request, Node_A_invoke_url, 'sendpayment', 'POST', { invoice: ln_invoice });
        const paymentData = await paymentRes.json();
        expect(paymentData).toBeDefined();
        expect(paymentData).toHaveProperty('payment_hash');
        expect(paymentData.status).toBe('Pending');
        Node_A_payment_hash = paymentData.payment_hash;
        // Mine a block
        await regtestApi(request, `mine 101`);
        await delay(20000);
    });
    test('Check if Node A Payment success', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds

        const paymentsRes = await invokeNodeApi(request, Node_A_invoke_url, 'listpayments', 'GET');
        const paymentsData = await paymentsRes.json();
        expect(paymentsData).toHaveProperty('payments');
        expect(paymentsData.payments.length).toBeGreaterThan(0);
        const payment = paymentsData.payments.find((payment: any) => payment.payment_hash === Node_A_payment_hash);
        expect(payment.status).toBe('Succeeded');
    });

    test('Handle LSP Order PendingOpen channel - /get_order?order_id=<order_id>', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const orderRes = await invokeLSPApi(request, `get_order?order_id=${order_id}`, 'GET');
        const orderData = await orderRes.json();
        expect(orderData).toBeDefined();
        expect(orderData.payment.ln.status).toBe('Succeeded');
        expect(orderData.payment.ln_asset.status).toBe('Expired');
    
        expect(typeof orderData.channel).toBe('object');
        expect(orderData.channel.status).toBe('PendingOpen');
        delay(30000);  
    })
    test('Complete LSP Order Open channel - /get_order?order_id=<order_id>', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const orderRes = await invokeLSPApi(request, `get_order?order_id=${order_id}`, 'GET');
        const orderData = await orderRes.json();
        expect(orderData).toBeDefined();
        expect(typeof orderData.channel).toBe('object');
        expect(orderData.channel.status).toBe('Open');
    })


});