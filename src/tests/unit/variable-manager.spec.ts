import { jest } from '@jest/globals';

import { VariableManager } from '../../variable-manager';

describe('variable-manager', function () {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('parseOptionsVariables', () => {
        it('should exit if one of the variables is not defined', () => {
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const variableManager = new VariableManager();
            variableManager.parseOptionsVariables(['']);

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
        it('should exit if one of the variables is not correctly formatted', () => {
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const variableManager = new VariableManager();
            variableManager.parseOptionsVariables(['test-true']);

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
        it('should return the variables as expected', () => {
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const variableManager = new VariableManager();
            variableManager.parseOptionsVariables([
                'name=skem',
                'test=this is a test'
            ]);

            expect(exitSpy).not.toHaveBeenCalled();
        });
    });
});
