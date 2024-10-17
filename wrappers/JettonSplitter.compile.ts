import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/jetton_splitter.tact',
    options: {
        debug: true,
    },
};
