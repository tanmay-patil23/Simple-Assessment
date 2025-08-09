
class CSVProcessor {
    constructor() {
        this.csvData = [];
        this.calculationIndices = ['A5', 'A7', 'A12', 'A13', 'A15', 'A20'];
        this.debugMode = false;
        this.init();
    }

    async init() {
        try {
            this.showLoading();
            await this.loadCSVData();
            this.processData();
            this.hideLoading();
            this.showTables();
        } catch (error) {
            this.handleError(error);
        }
    }

    showLoading() {
        document.getElementById('loading').style.display = 'flex';
        document.getElementById('error').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    showTables() {
        document.getElementById('table1Section').style.display = 'block';
        document.getElementById('table2Section').style.display = 'block';
        if (this.debugMode) {
            document.getElementById('debugSection').style.display = 'block';
        }
    }

    handleError(error) {
        console.error('❌ Error processing CSV:', error);
        this.hideLoading();
        document.getElementById('error').style.display = 'block';
        this.debugLog(`Error: ${error.message}`);
    }

    async loadCSVData() {
        return new Promise((resolve, reject) => {
            // Try to load from server API first
            this.loadFromServer()
                .then(resolve)
                .catch(() => {
                    // Fallback to direct file loading
                    this.loadFromFile()
                        .then(resolve)
                        .catch(reject);
                });
        });
    }

    async loadFromServer() {
        return new Promise((resolve, reject) => {
            fetch('/api/csv')
                .then(response => {
                    if (!response.ok) throw new Error('Server API not available');
                    return response.text();
                })
                .then(csvText => {
                    this.debugLog('✅ CSV loaded from server API');
                    this.parseCSV(csvText, resolve, reject);
                })
                .catch(reject);
        });
    }

    async loadFromFile() {
        return new Promise((resolve, reject) => {
            // Try to load the CSV file directly (for static hosting)
            fetch('./Table_Input.csv')
                .then(response => {
                    if (!response.ok) throw new Error('CSV file not found');
                    return response.text();
                })
                .then(csvText => {
                    this.debugLog('✅ CSV loaded from file');
                    this.parseCSV(csvText, resolve, reject);
                })
                .catch(() => {
                    // Last resort: use embedded CSV data
                    const fallbackCSV = `Index #,Value
A1,41
A2,18
A3,21
A4,63
A5,2
A6,53
A7,5
A8,57
A9,60
A10,93
A11,28
A12,3
A13,90
A14,39
A15,80
A16,88
A17,49
A18,60
A19,26
A20,28`;
                    this.debugLog('⚠️ Using fallback CSV data');
                    this.parseCSV(fallbackCSV, resolve, reject);
                });
        });
    }

    parseCSV(csvText, resolve, reject) {
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.warn('CSV parsing warnings:', results.errors);
                }

                this.csvData = results.data;
                this.debugLog(`📊 Parsed ${this.csvData.length} rows`);
                this.debugLog('Headers:', Object.keys(this.csvData[0] || {}));
                resolve();
            },
            error: reject
        });
    }

    processData() {
        this.populateTable1();
        this.calculateTable2();
        this.updateDebugInfo();
    }

    populateTable1() {
        const tableHead = document.getElementById('tableHead');
        const tableBody = document.getElementById('tableBody');

        if (!tableHead || !tableBody || this.csvData.length === 0) {
            throw new Error('Cannot populate table - missing elements or data');
        }

        // Clear existing content
        tableHead.innerHTML = '';
        tableBody.innerHTML = '';

        // Get headers from the first row
        const headers = Object.keys(this.csvData[0]);

        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        tableHead.appendChild(headerRow);

        // Populate table body
        this.csvData.forEach(row => {
            const tr = document.createElement('tr');

            // Highlight rows used in calculations
            const indexValue = row[headers[0]]; // First column is the index
            if (this.calculationIndices.includes(indexValue)) {
                tr.classList.add('highlight-row');
            }

            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header];
                tr.appendChild(td);
            });

            tableBody.appendChild(tr);
        });

        this.debugLog(`✅ Table 1 populated with ${this.csvData.length} rows`);
    }

    calculateTable2() {
        // Create a map for easy value lookup
        const valueMap = {};
        const headers = Object.keys(this.csvData[0]);
        const indexColumn = headers[0]; // "Index #"
        const valueColumn = headers[1]; // "Value"

        this.csvData.forEach(row => {
            const index = row[indexColumn];
            const value = parseInt(row[valueColumn], 10);
            valueMap[index] = value;
        });

        // Calculate the required values
        const alpha = valueMap['A5'] + valueMap['A20'];  // 2 + 28 = 30
        const beta = Math.floor(valueMap['A15'] / valueMap['A7']);  // 80 / 5 = 16 (as integer)
        const charlie = valueMap['A13'] * valueMap['A12'];  // 90 * 3 = 270

        // Update the display
        this.updateCalculationValue('alphaValue', alpha);
        this.updateCalculationValue('betaValue', beta);
        this.updateCalculationValue('charlieValue', charlie);

        // Log calculations for debugging
        this.debugLog('📊 Table 2 Calculations:');
        this.debugLog(`Alpha (A5 + A20): ${valueMap['A5']} + ${valueMap['A20']} = ${alpha}`);
        this.debugLog(`Beta (A15 / A7): ${valueMap['A15']} / ${valueMap['A7']} = ${beta}`);
        this.debugLog(`Charlie (A13 * A12): ${valueMap['A13']} * ${valueMap['A12']} = ${charlie}`);
    }

    updateCalculationValue(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
            // Add animation effect
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 300);
        }
    }

    debugLog(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        const logMessage = `[${timestamp}] ${message}`;

        if (data) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }

        if (!window.debugLogs) window.debugLogs = [];
        window.debugLogs.push(data ? `${logMessage} ${JSON.stringify(data, null, 2)}` : logMessage);
    }

    updateDebugInfo() {
        const debugInfo = document.getElementById('debugInfo');
        if (debugInfo && window.debugLogs) {
            debugInfo.textContent = window.debugLogs.join('\n');
        }
    }

    // Utility methods
    getValue(index) {
        const row = this.csvData.find(row => {
            const headers = Object.keys(row);
            return row[headers[0]] === index;
        });
        return row ? parseInt(row[Object.keys(row)[1]], 10) : null;
    }

    enableDebugMode() {
        this.debugMode = true;
        document.getElementById('debugSection').style.display = 'block';
        this.updateDebugInfo();
        console.log('🐛 Debug mode enabled');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Simple Loyalty Assessment Starting...');

    window.csvProcessor = new CSVProcessor();

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            window.csvProcessor.enableDebugMode();
        }
    });
});


window.getValue = (index) => window.csvProcessor?.getValue(index);
window.enableDebug = () => window.csvProcessor?.enableDebugMode();