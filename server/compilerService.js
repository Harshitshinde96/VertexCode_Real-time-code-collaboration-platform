import axios from 'axios';

// Map our language names to what Piston API expects
const languageMap = {
    javascript: { language: 'javascript', version: '18.15.0' },
    python: { language: 'python', version: '3.10.0' },
    java: { language: 'java', version: '15.0.2' },
    c: { language: 'c', version: '10.2.0' },
    // You can add more languages here
};

// Check for input functions (a simple version)
const hasInputFunctions = (code, language) => {
    if (language === 'c') {
        return /scanf|gets|fgets|getchar/.test(code);
    }
    if (language === 'python') {
        return /input\s*\(\s*\)/.test(code);
    }
    // Add checks for other languages if needed
    return false;
};

export const executeCode = async (language, code, stdin) => {
    const langData = languageMap[language];
    if (!langData) {
        return { error: 'Language not supported' };
    }

    // If code needs input but none is provided, ask for it.
    if (hasInputFunctions(code, language) && !stdin) {
        return { 
            output: 'Program is waiting for input...', 
            waitingForInput: true 
        };
    }

    try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
            language: langData.language,
            version: langData.version,
            files: [{ content: code }],
            stdin: stdin,
            run_timeout: 10000,
            compile_timeout: 10000,
        });

        const result = response.data;
        const output = result.run.output || result.run.stderr || 'No output';
        
        // This is a basic check. Piston doesn't have a great way 
        // to signal "waiting for more input", so we simulate it.
        const waitingForInput = (result.run.stderr && result.run.stderr.includes('EOF')) ||
                                (hasInputFunctions(code, language) && !result.run.stderr);


        return { 
            output, 
            waitingForInput
        };

    } catch (error) {
        console.error('Piston API error:', error.response ? error.response.data : error.message);
        return { error: 'Error connecting to compiler service' };
    }
};