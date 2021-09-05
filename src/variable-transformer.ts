export interface VariableTransformParams {
    transform: string;
    skipIfDefined?: boolean;
}

export const variableModifiers: string[] = [
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
];

export class VariableTransformer {
    static transform(
        variableName: string,
        transformParams: Record<string, VariableTransformParams>,
        variables: Record<string, string>
    ): string {
        if (transformParams[variableName]) {
            let carryOn = true;
            let currentTransform = transformParams[variableName].transform;
            while (carryOn) {
                currentTransform = currentTransform
                    .replace(
                        /([a-z0-9]+)\(([^()]+)\)/ig,
                        (substring, method: string, value: string) => {
                            let values = value.split(',');
                            values = values.map(v => {
                                if (variables[v]) {
                                    return variables[v];
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
        return variables[variableName];
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
}
