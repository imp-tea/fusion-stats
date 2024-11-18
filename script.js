// script.js
const columns = [
    "Number", "Name", "HP", "Attack", "Defense", "Special Attack", "Special Defense", "Speed",
    "Type 1", "Type 2", "First Stage", "Final Stage", "Legendary", "BST",
    "Head Stat Total", "Body Stat Total", "Stat Balance", "Head Stat Balance", "Body Stat Balance"
];

let tableData = [];
let filteredData = [];
let sortColumn = null;
let sortAscending = true;

fetch('stats.csv')
    .then(response => response.text())
    .then(data => {
        tableData = parseCSV(data);
        filteredData = tableData.slice(); // Make a copy
        generateTable(filteredData);
        generateFilters();
    });

function parseCSV(data) {
    const lines = data.trim().split('\n');
    const headers = lines[0].split(',');
    const result = [];
    for(let i = 1; i < lines.length; i++) {
        const obj = {};
        const currentline = lines[i].split(',');
        for(let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    return result;
}

function generateTable(data) {
    const table = document.getElementById('statsTable');
    table.innerHTML = ''; // Clear existing table content

    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    // Create header row
    const headerRow = document.createElement('tr');
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column;
        if (sortColumn === column) {
            th.textContent += sortAscending ? ' ▲' : ' ▼';
        }
        th.addEventListener('click', () => {
            sortTableByColumn(filteredData, column);
            generateTable(filteredData);
        });
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create data rows
    data.forEach(row => {
        const tr = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            if (column === 'Name') {
                const a = document.createElement('a');
                a.textContent = row[column];
                a.href = `https://www.fusiondex.org/#/${row['Number']}`;
                td.appendChild(a);
            } else {
                td.textContent = row[column];
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
}

function sortTableByColumn(data, column) {
    if (sortColumn === column) {
        sortAscending = !sortAscending;
    } else {
        sortColumn = column;
        sortAscending = true;
    }
    data.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Convert numerical values to numbers
        if (!isNaN(valA) && !isNaN(valB)) {
            valA = Number(valA);
            valB = Number(valB);
        } else {
            // For boolean columns ('First Stage', 'Final Stage', 'Legendary')
            if (valA === 'True') valA = true;
            if (valA === 'False') valA = false;
            if (valB === 'True') valB = true;
            if (valB === 'False') valB = false;
        }

        if (valA < valB) return sortAscending ? -1 : 1;
        if (valA > valB) return sortAscending ? 1 : -1;
        return 0;
    });
}

function generateFilters() {
    // Hide Columns
    const hideColumnsDiv = document.getElementById('hideColumns');
    columns.forEach(column => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = column;
        checkbox.addEventListener('change', () => {
            // Show or hide the column
            toggleColumnVisibility(column, checkbox.checked);
        });
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(column));
        hideColumnsDiv.appendChild(label);
    });

    // Exclude Types
    const types = ["NORMAL", "GRASS", "FIRE", "WATER", "BUG", "POISON", "FLYING", "ROCK", "GROUND", "FAIRY", "FIGHTING", "PSYCHIC", "DARK", "GHOST", "ICE", "STEEL", "DRAGON"];
    const excludeType1Div = document.getElementById('excludeType1');
    const excludeType2Div = document.getElementById('excludeType2');

    types.forEach(type => {
        // Type 1
        const label1 = document.createElement('label');
        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        checkbox1.value = type;
        checkbox1.addEventListener('change', applyFilters);
        label1.appendChild(checkbox1);
        label1.appendChild(document.createTextNode(type));
        excludeType1Div.appendChild(label1);

        // Type 2
        const label2 = document.createElement('label');
        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.value = type;
        checkbox2.addEventListener('change', applyFilters);
        label2.appendChild(checkbox2);
        label2.appendChild(document.createTextNode(type));
        excludeType2Div.appendChild(label2);
    });

    // Stat Ranges
    const statRangesDiv = document.getElementById('statRanges');
    const stats = [
        { name: 'HP', min: 1, max: 255, step: 1 },
        { name: 'Attack', min: 1, max: 255, step: 1 },
        { name: 'Defense', min: 1, max: 255, step: 1 },
        { name: 'Special Attack', min: 1, max: 255, step: 1 },
        { name: 'Special Defense', min: 1, max: 255, step: 1 },
        { name: 'Speed', min: 1, max: 255, step: 1 },
        { name: 'BST', min: 1, max: 800, step: 1 },
        { name: 'Head Stat Total', min: 1, max: 255 * 3, step: 1 },
        { name: 'Body Stat Total', min: 1, max: 255 * 3, step: 1 },
        { name: 'Stat Balance', min: 0, max: 1.5, step: 0.01 },
        { name: 'Head Stat Balance', min: 0, max: 1.5, step: 0.01 },
        { name: 'Body Stat Balance', min: 0, max: 1.5, step: 0.01 }
    ];

    stats.forEach(stat => {
        const container = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = stat.name;

        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.min = stat.min;
        minInput.max = stat.max;
        minInput.step = stat.step;
        minInput.value = stat.min;
        minInput.addEventListener('change', applyFilters);

        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.min = stat.min;
        maxInput.max = stat.max;
        maxInput.step = stat.step;
        maxInput.value = stat.max;
        maxInput.addEventListener('change', applyFilters);

        container.appendChild(label);
        container.appendChild(minInput);
        container.appendChild(document.createTextNode(' - '));
        container.appendChild(maxInput);

        statRangesDiv.appendChild(container);
    });

    // Misc Options
    const miscOptionsDiv = document.getElementById('miscOptions');
    const options = [
        { name: 'Show Legendaries', default: true },
        { name: 'First Stages Only', default: false },
        { name: 'Final Stages Only', default: false }
    ];
    options.forEach(option => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = option.default;
        checkbox.addEventListener('change', applyFilters);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(option.name));
        miscOptionsDiv.appendChild(label);
    });
}

function applyFilters() {
    // Start with the full data set
    filteredData = tableData.filter(row => {
        // Apply filters

        // Exclude Types
        const excludeType1 = Array.from(document.querySelectorAll('#excludeType1 input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
        const excludeType2 = Array.from(document.querySelectorAll('#excludeType2 input[type="checkbox"]:checked')).map(checkbox => checkbox.value);

        if (excludeType1.includes(row['Type 1'])) {
            return false;
        }
        if (excludeType2.includes(row['Type 2'])) {
            return false;
        }

        // Stat Ranges
        const statRangesDiv = document.getElementById('statRanges');
        const statDivs = statRangesDiv.querySelectorAll('div');
        let passStatRanges = true;
        statDivs.forEach(statDiv => {
            const inputs = statDiv.querySelectorAll('input');
            const statName = statDiv.querySelector('label').textContent;
            const min = parseFloat(inputs[0].value);
            const max = parseFloat(inputs[1].value);
            const value = parseFloat(row[statName]);
            if (value < min || value > max) {
                passStatRanges = false;
            }
        });
        if (!passStatRanges) {
            return false;
        }

        // Misc Options
        const miscOptions = document.querySelectorAll('#miscOptions input[type="checkbox"]');
        let showLegendaries = miscOptions[0].checked;
        let firstStagesOnly = miscOptions[1].checked;
        let finalStagesOnly = miscOptions[2].checked;

        if (!showLegendaries && row['Legendary'] === 'True') {
            return false;
        }
        if (firstStagesOnly && row['First Stage'] !== 'True') {
            return false;
        }
        if (finalStagesOnly && row['Final Stage'] !== 'True') {
            return false;
        }

        // All filters passed
        return true;
    });

    // Re-sort filtered data
    if (sortColumn) {
        sortTableByColumn(filteredData, sortColumn);
    }

    generateTable(filteredData);
}

function toggleColumnVisibility(column, hide) {
    const table = document.getElementById('statsTable');
    const columnIndex = columns.indexOf(column);

    // Hide or show column headers
    const headerCells = table.querySelectorAll('thead th');
    if (headerCells[columnIndex]) {
        headerCells[columnIndex].style.display = hide ? 'none' : '';
    }

    // Hide or show column cells
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells[columnIndex]) {
            cells[columnIndex].style.display = hide ? 'none' : '';
        }
    });
}
