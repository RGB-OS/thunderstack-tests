import { test, expect, type Page } from '@playwright/test';


const NODE_NAME = process.env.NODE_NAME;

// NODE_NAME=Node_B npx playwright test tests/api.node-env.test.ts

console.log(process.env[`${NODE_NAME}_ID`]);

test.describe.serial('NodeEnv', () => {
    test.beforeEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });

    test.afterEach(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 seconds delay
    });
    test('set node env', async ({ request }) => {
        // await updateEnvFile(NODE_NAME, `${NODE_NAME}_ID`, '11122');
        // await updateEnvFile(NODE_NAME, 'NODE_NAME2', '1');
        // await updateEnvFile(NODE_NAME, 'NODE_NAME3', '2');
    });
});