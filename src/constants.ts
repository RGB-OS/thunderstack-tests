

export const cloudApi = process.env.CLOUD_API
export const auth = process.env.AUTH_TOKEN
export const regtestNetwork = {
    "bitcoind_rpc_username": process.env.RPC_USERNAME,
    "bitcoind_rpc_password":process.env.RPC_PASSWORD,
    "bitcoind_rpc_host": process.env.RPC_HOST,
    "bitcoind_rpc_port": process.env.RPC_PORT,
    "indexer_url": process.env.INDEXER_URL,
    "proxy_endpoint":process.env.PROXY_URL
}
