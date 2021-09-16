export interface VariableTransformParams {
    transform?: string;
    skipIfDefined?: boolean;
    default?: string;
}
export interface VariableTransformParamsWithDependencies extends VariableTransformParams {
    dependencies: string[];
}

export interface SkemConfigVariableTransform {
    variableTransform?: Record<string, VariableTransformParams>;
}

export interface SkemConfigVariableTransformWithDependencies {
    variableTransform: Record<string, VariableTransformParamsWithDependencies>;
}

const variableModifiers = [
    'camelCase',
    'pascalCase',
    'snakeCase',
    'upperSnakeCase',
    'kebabCase',
    'spaceCase',
    'upperCase',
    'lowerCase',
    'replace',
    'concat',
    'join',
    'splitPart',
];

export class VariableTransformer {
    static transform(
        variableName: string,
        transformParams: Record<string, VariableTransformParamsWithDependencies>,
        variables: Record<string, string | null>
    ): string {
        if (transformParams[variableName]?.transform) {
            let carryOn = true;
            let currentTransform = transformParams[variableName].transform as string;
            while (carryOn) {
                currentTransform = currentTransform
                    .replace(
                        /([a-z0-9]+)\(([^()]+)\)/ig,
                        (substring, method: string, value: string) => {
                            let values = value.split(',');
                            values = values.map(v => {
                                if (variables[v]) {
                                    return variables[v] || '';
                                }
                                return v.replace(/['"]/g, '');
                            });
                            return VariableModifiers[method](...values);
                        }
                    );
                carryOn = /\([^(]+\)/.test(currentTransform);
            }
            return currentTransform;
        }
        return variables[variableName] as string;
    }

    static getRelatedVariables(transform?: string): string[] {
        if (!transform) {
            return [];
        }
        let transformWithoutModifiers = transform
            .replace(/["'].*?["']/g, '');
        for (const variableModifier of variableModifiers) {
            while(new RegExp(`${variableModifier}\\(([^()]+)\\)`, 'ig').test(transformWithoutModifiers)) {
                transformWithoutModifiers = transformWithoutModifiers
                    .replace(new RegExp(`${variableModifier}\\(([^()]+)\\)`, 'ig'), '$1');
            }
        }
        const variableNames = transformWithoutModifiers
            .split(',')
            .filter(v => !!v && !/^[0-9]+$/.test(v))
            .map(v => v.trim());
        return variableNames.reduce((agg: string[], curr) => {
            if (!agg.some(v => curr === v)) {
                agg.push(curr);
            }
            return agg;
        }, []);
    }

    static parseTransformer(input: VariableTransformParams ): VariableTransformParamsWithDependencies {
        return {
            ...input,
            dependencies: VariableTransformer.getRelatedVariables(input.transform)
        };
    }

    static validateTransform(transform: string): string | undefined {
        // validate there are no spaces
        const transformWithoutConstants = transform
            .replace(/["'].*?["']/g, '');
        if (transformWithoutConstants.indexOf(' ') > -1) {
            return 'No space allowed in the expression';
        }
        // validate all commands are known
        const modifiers = transformWithoutConstants.match(/([a-z0-9]+)\(/gi);
        if (modifiers) {
            for (let i = 1; i < modifiers.length; i++) {
                const modifier = modifiers[i].slice(0, modifiers[i].length - 1);
                if (!variableModifiers.some(m => m === modifier)) {
                    return `Unknown modifier: "${modifier}"`;
                }
            }
        }
        // todo validate number of params are correct
        // todo validate type of params are correct
        return;
    }

    static validateDependencies(variableTransform: Record<string, VariableTransformParamsWithDependencies>): string | undefined {
        const keys = Object.keys(variableTransform);
        for (const key of keys) {
            for (const dependency of variableTransform[key]?.dependencies) {
                if (VariableTransformer.returnIfCircularDependency(key, dependency, variableTransform)) {
                    return 'Circular dependency';
                }
            }
        }
        return;
    }

    private static returnIfCircularDependency(topVariableName: string, variableName: string, variableTransform: Record<string, VariableTransformParamsWithDependencies>) {
        if (variableTransform[variableName]?.dependencies) {
            for (const dependency of variableTransform[variableName]?.dependencies) {
                if (topVariableName === dependency) {
                    return true;
                }
                if (VariableTransformer.returnIfCircularDependency(topVariableName, dependency, variableTransform)) {
                    return true;
                }
            }
        }
        return false;
    }

    static canBeSolved(variableName: string, variableTransform: Record<string, VariableTransformParamsWithDependencies>, variables: Record<string, string | null>): boolean {
        return !variableTransform[variableName].dependencies.some(d => !variables[d]);
    }
}

export class VariableModifiers {
    static [name: string]: (..._args: string[]) => string;

    static camelCase(...values: string[]): string {
        const val = values[0];
        if (/[^a-zA-Z0-9]/.test(val)) {
            return val
                .toLowerCase()
                .replace(
                    /[^a-z0-9][a-z0-9]/g,
                    (subString) => subString.slice(1, 2).toUpperCase()
                );
        }
        return val
            .replace(
                /^[A-Z]/,
                (subString) => subString.toLowerCase()
            );
    }

    static pascalCase(...values: string[]): string {
        const val = values[0];
        return this.camelCase(val)
            .replace(
                /^[a-z]/,
                (subString) => subString.toUpperCase()
            );
    }

    static snakeCase(...values: string[]): string {
        const val = values[0];
        if (/[^a-zA-Z0-9]/.test(val)) {
            return val
                .toLowerCase()
                .replace(
                    /[^a-zA-Z0-9]/g,
                    '_'
                );
        }
        return val
            .replace(
                /[a-z0-9][A-Z]/g,
                (subString) => `${subString.slice(0, 1)}_${subString.slice(1, 2)}`
            )
            .toLowerCase();
    }

    static upperSnakeCase(...values: string[]): string {
        const val = values[0];
        return this.snakeCase(val)
            .toUpperCase();
    }

    static kebabCase(...values: string[]): string {
        const val = values[0];
        if (/[^a-zA-Z0-9]/.test(val)) {
            return val
                .toLowerCase()
                .replace(
                    /[^a-zA-Z0-9]/g,
                    '-'
                );
        }
        return val
            .replace(
                /[a-z0-9][A-Z]/g,
                (subString) => `${subString.slice(0, 1)}-${subString.slice(1, 2)}`
            )
            .toLowerCase();
    }

    static spaceCase(...values: string[]): string {
        const val = values[0];
        if (/[^a-zA-Z0-9]/.test(val)) {
            return val
                .toLowerCase()
                .replace(
                    /[^a-zA-Z0-9]/g,
                    ' '
                );
        }
        return val
            .replace(
                /[a-z0-9][A-Z]/g,
                (subString) => `${subString.slice(0, 1)} ${subString.slice(1, 2)}`
            )
            .toLowerCase();
    }

    static upperCase(...values: string[]): string {
        return values[0].toUpperCase();
    }

    static lowerCase(...values: string[]): string {
        return values[0].toLowerCase();
    }

    static replace(...values: string[]): string {
        const [val, replace, replaceWith, options] = values;
        return val.replace(new RegExp(replace, options), replaceWith);
    }

    static concat(...values: string[]): string {
        return values.join('');
    }

    static join(...values: string[]): string {
        const [separator, ...valuesToJoin] = values;
        return valuesToJoin.join(separator);
    }

    static splitPart(...values: string[]): string {
        const [val, splitWith, part] = values;
        const partIndex = +part;
        return val.split(splitWith)[partIndex];
    }
}
