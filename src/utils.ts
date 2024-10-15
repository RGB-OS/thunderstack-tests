import { auth } from "./constants";
export const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
export const invokeNodeApi = async (request, nodeApi, route, method = 'GET', body = {}) => {
    const userIdNodeIdPath = nodeApi.split('/nodes')[1];
    const url = `https://node-api.thunderstack.org${userIdNodeIdPath}${route}`;
    console.log('NodeApi Call: ', url, body);
    const response = await request.fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `${auth}`,
        },
        data: method !== 'GET' ? body : undefined,
    });
    const t = await response.json()
    console.log(t);
    return response;
};

export const invokeLSPApi = async (request, route, method = 'GET', body = {}) => {
    const url = `https://cloud-api.test.thunderstack.org/${route}`;
    console.log('LSP_Api Call: ', body);
    const response = await request.fetch(url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `${auth}`,
        },
        data: method !== 'GET' ? body : undefined,
    });
    const t = await response.json()
    console.log('LSP_Api responce',t);
    return response;
};

export const regtestApi = async (request, command) => {
    const url = ` http://18.119.98.232:5000/execute`;
    const response = await request.fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        data: { "args": command },
    });
    const t = await response.json()
    console.log(t);
    return response;
};