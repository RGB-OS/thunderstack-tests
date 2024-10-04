import { test, expect, type Page } from '@playwright/test';
import { destroyNode, pollGetNodeStatus } from '../src/methods';
// NODE_NAME=Node_B npx playwright test tests/api.node-destroy.test.ts   

const NODE_NAME = process.env.NODE_NAME;
const NODE_ID = process.env[`${NODE_NAME}_ID`];
test.describe.serial('Destroy Channel Tests', () => {
   test('Start Destoy Node flow', async ({ request }) => {
        const res = await destroyNode(request, NODE_ID);
        expect(res.data).toBeDefined();
        expect(res.ok()).toBeTruthy();
    })
    test('Node Destoy build complete', async ({ request }) => {
        test.setTimeout(61000 * 5);// 5 minutes in milliseconds
        const timeout = 300000; // 5 minutes in milliseconds
        const interval = 30000; // Poll every 30 seconds
        const response = await pollGetNodeStatus(request, NODE_ID, timeout, interval);
        expect(response.data.status).toBe('DESTROYED');
    })
});