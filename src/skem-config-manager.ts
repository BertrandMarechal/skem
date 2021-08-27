import fs from 'fs';

export const CONFIGURATION_FILE_NAME = 'skem.config.json';

export interface SkemConfig {
    name?: string;
}

export class SkemConfigManager {
    private _config: SkemConfig | undefined;

    constructor(configFileName: string) {
        if (!configFileName) {
            return;
        }
        try {
            const fileContent = fs.readFileSync(configFileName, 'ascii');
            if (!fileContent) {
                return;
            }
            try {
                this._config = JSON.parse(fileContent);
            } catch {
                return;
            }
        } catch {
            return;
        }
    }

    public get name(): string {
        return this._config?.name || '';
    }

}
