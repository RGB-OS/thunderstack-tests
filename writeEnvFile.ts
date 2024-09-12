import { promises as fs } from 'fs';
import path from "path";


const envDirectory = path.resolve(__dirname, 'node_envs');

export const updateEnvFile = async (fileName, envName, envValue) => {
    try {

        try {
            await fs.access(envDirectory);
        } catch {
            console.log('node_envs directory not found, creating...');
            await fs.mkdir(envDirectory);
        }
        const envFilePath = path.join(envDirectory, `${fileName}.env`);

        let data = '';
        try {

            data = await fs.readFile(envFilePath, 'utf8');
        } catch (err) {

            if (err.code === 'ENOENT') {
                console.log(`File ${fileName}.env not found, creating a new one...`);
                await fs.writeFile(envFilePath, ''); 
            } else {
                throw err;
            }
        }

        const regex = new RegExp(`^${envName}=.*`, 'gm');

        let newEnvFileContent;
        if (regex.test(data)) {
            
            newEnvFileContent = data.replace(regex, `${envName}=${envValue}`);
        } else {
    
            newEnvFileContent = data ? data + `\n${envName}=${envValue}` : `${envName}=${envValue}`;
            // newEnvFileContent = data + `\n${envName}=${envValue}`;
        }

       
        await fs.writeFile(envFilePath, newEnvFileContent, 'utf8');
        console.log(`${fileName}.env updated successfully! Set ${envName}=${envValue}`);
    } catch (err) {
        console.error('Error updating the .env file:', err);
    }
}
