import { VariableModifiers, VariableTransformer } from '../../variable-transformer';

describe('variable-transformer', function () {
    describe('VariableTransformer', function () {
        describe('transform', function () {
            it('should return the variable value if no transformation is set up', function () {
                expect(VariableTransformer.transform(
                    'var',
                    {},
                    { var: 'value', otherVar: 'other-var' }
                )).toEqual('value');
            });
            it('should return the variable value transformed for a simple transformation', function () {
                expect(VariableTransformer.transform(
                    'var',
                    {
                        var: {
                            transform: 'camelCase(otherVar)',
                            skipIfDefined: true,
                        }
                    },
                    { var: 'value', otherVar: 'other-value' }
                )).toEqual('otherValue');
            });
            it('should return the variable value transformed for a complex transformation', function () {
                expect(VariableTransformer.transform(
                    'var',
                    {
                        var: {
                            transform: 'join(\'@\',upperSnakeCase(otherVar),replace(kebabCase(concat(andAnotherVar,\'able\')),\'val\',\'amazing-val\'))',
                            skipIfDefined: true,
                        }
                    },
                    { var: 'value', otherVar: 'other-value', andAnotherVar: 'AndAnotherValue' }
                )).toEqual('OTHER_VALUE@and-another-amazing-valueable');
            });
        });
    });
    describe('VariableModifiers', function () {
        describe('case', function () {
            describe('camelCase', function () {
                it('should change a kebab-case to camelCase', function () {
                    expect(VariableModifiers.camelCase('long-string-to-format')).toEqual('longStringToFormat');
                });
                it('should change snake_case to camelCase', function () {
                    expect(VariableModifiers.camelCase('long_string_to_format')).toEqual('longStringToFormat');
                });
                it('should change UPPER_SNAKE_CASE to camelCase', function () {
                    expect(VariableModifiers.camelCase('LONG_STRING_TO_FORMAT')).toEqual('longStringToFormat');
                });
                it('should change PascalCase to camelCase', function () {
                    expect(VariableModifiers.camelCase('LongStringToFormat')).toEqual('longStringToFormat');
                });
                it('should change space case to camelCase', function () {
                    expect(VariableModifiers.camelCase('long string to format')).toEqual('longStringToFormat');
                });
            });
            describe('PascalCase', function () {
                it('should change a kebab-case to PascalCase', function () {
                    expect(VariableModifiers.pascalCase('long-string-to-format')).toEqual('LongStringToFormat');
                });
                it('should change snake_case to PascalCase', function () {
                    expect(VariableModifiers.pascalCase('long_string_to_format')).toEqual('LongStringToFormat');
                });
                it('should change UPPER_SNAKE_CASE to PascalCase', function () {
                    expect(VariableModifiers.pascalCase('LONG_STRING_TO_FORMAT')).toEqual('LongStringToFormat');
                });
                it('should change camelCase to PascalCase', function () {
                    expect(VariableModifiers.pascalCase('longStringToFormat')).toEqual('LongStringToFormat');
                });
                it('should change space case to PascalCase', function () {
                    expect(VariableModifiers.pascalCase('long string to format')).toEqual('LongStringToFormat');
                });
            });
            describe('snake_case', function () {
                it('should change a kebab-case to snake_case', function () {
                    expect(VariableModifiers.snakeCase('long-string-to-format')).toEqual('long_string_to_format');
                });
                it('should change PascalCase to snake_case', function () {
                    expect(VariableModifiers.snakeCase('LongStringToFormat')).toEqual('long_string_to_format');
                });
                it('should change UPPER_SNAKE_CASE to snake_case', function () {
                    expect(VariableModifiers.snakeCase('LONG_STRING_TO_FORMAT')).toEqual('long_string_to_format');
                });
                it('should change camelCase to snake_case', function () {
                    expect(VariableModifiers.snakeCase('longStringToFormat')).toEqual('long_string_to_format');
                });
                it('should change space case to snake_case', function () {
                    expect(VariableModifiers.snakeCase('long string to format')).toEqual('long_string_to_format');
                });
            });
            describe('UPPER_SNAKE_CASE', function () {
                it('should change a kebab-case to UPPER_SNAKE_CASE', function () {
                    expect(VariableModifiers.upperSnakeCase('long-string-to-format')).toEqual('LONG_STRING_TO_FORMAT');
                });
                it('should change PascalCase to UPPER_SNAKE_CASE', function () {
                    expect(VariableModifiers.upperSnakeCase('LongStringToFormat')).toEqual('LONG_STRING_TO_FORMAT');
                });
                it('should change snake_case to UPPER_SNAKE_CASE', function () {
                    expect(VariableModifiers.upperSnakeCase('long_string_to_format')).toEqual('LONG_STRING_TO_FORMAT');
                });
                it('should change camelCase to UPPER_SNAKE_CASE', function () {
                    expect(VariableModifiers.upperSnakeCase('longStringToFormat')).toEqual('LONG_STRING_TO_FORMAT');
                });
                it('should change space case to snake_case', function () {
                    expect(VariableModifiers.upperSnakeCase('long string to format')).toEqual('LONG_STRING_TO_FORMAT');
                });
            });
            describe('kebab-case', function () {
                it('should change a UPPER_SNAKE_CASE to kebab-case', function () {
                    expect(VariableModifiers.kebabCase('LONG_STRING_TO_FORMAT')).toEqual('long-string-to-format');
                });
                it('should change PascalCase to kebab-case', function () {
                    expect(VariableModifiers.kebabCase('LongStringToFormat')).toEqual('long-string-to-format');
                });
                it('should change snake_case to kebab-case', function () {
                    expect(VariableModifiers.kebabCase('long_string_to_format')).toEqual('long-string-to-format');
                });
                it('should change camelCase to kebab-case', function () {
                    expect(VariableModifiers.kebabCase('longStringToFormat')).toEqual('long-string-to-format');
                });
                it('should change space case to kebab-case', function () {
                    expect(VariableModifiers.kebabCase('long string to format')).toEqual('long-string-to-format');
                });
            });
            describe('space case', function () {
                it('should change a UPPER_SNAKE_CASE to space case', function () {
                    expect(VariableModifiers.spaceCase('LONG_STRING_TO_FORMAT')).toEqual('long string to format');
                });
                it('should change PascalCase to space case', function () {
                    expect(VariableModifiers.spaceCase('LongStringToFormat')).toEqual('long string to format');
                });
                it('should change snake_case to space case', function () {
                    expect(VariableModifiers.spaceCase('long_string_to_format')).toEqual('long string to format');
                });
                it('should change camelCase to space case', function () {
                    expect(VariableModifiers.spaceCase('longStringToFormat')).toEqual('long string to format');
                });
                it('should change kebab-case to space case', function () {
                    expect(VariableModifiers.spaceCase('long-string-to-format')).toEqual('long string to format');
                });
            });

            describe('upperCase', function () {
                it('should put the word to upper case', function () {
                    expect(VariableModifiers.upperCase('low-case-string')).toEqual('LOW-CASE-STRING');
                });
            });
            describe('lowerCase', function () {
                it('should put the word to lower case', function () {
                    expect(VariableModifiers.lowerCase('LOW-CASE-STRING')).toEqual('low-case-string');
                });
            });
        });
        describe('replace', function () {
            it('should replace with no options', function () {
                expect(VariableModifiers.replace('my string string', 'string', 'other string')).toEqual('my other string string');
            });
            it('should replace with options', function () {
                expect(VariableModifiers.replace('my string String', 'string', 'other string', 'gi')).toEqual('my other string other string');
            });
        });
        describe('concat', function () {
            it('should concatenate the strings', function () {
                expect(VariableModifiers.concat('LOW', 'CASE', 'STRING')).toEqual('LOWCASESTRING');
            });
        });
        describe('join', function () {
            it('should concatenate the strings', function () {
                expect(VariableModifiers.join('-', 'LOW', 'CASE', 'STRING')).toEqual('LOW-CASE-STRING');
            });
        });
    });
});
