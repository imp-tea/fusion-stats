// script.js
let pokemonData = [];
let currentSortColumn = null;
let sortAscending = true;

async function loadData() {
    const response = await fetch('stats.csv');
    const text = await response.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',');
    
    pokemonData = rows.slice(1).filter(row => row.trim()).map(row => {
        const values = row.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });

    setupTable();
    setupFilters();
    updateTable();
}

function setupTable() {
    const table = document.getElementById('pokemon-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    const headerRow = document.createElement('tr');
    Object.keys(pokemonData[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.onclick = () => sortTable(key);
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
}

function updateTable() {
    const tbody = document.querySelector('#pokemon-table tbody');
    tbody.innerHTML = '';

    const visibleData = filterData();

    visibleData.forEach(pokemon => {
        const row = document.createElement('tr');
        Object.entries(pokemon).forEach(([key, value]) => {
            const td = document.createElement('td');
            if (key === 'Name') {
                const link = document.createElement('a');
                link.href = `https://www.fusiondex.org/${pokemon.Number}/`;
                link.textContent = value;
                td.appendChild(link);
            } else {
                td.textContent = value;
            }
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    
    applyColumnVisibility();
}

function sortTable(column) {
    if (currentSortColumn === column) {
        sortAscending = !sortAscending;
    } else {
        currentSortColumn = column;
        sortAscending = true;
    }

    pokemonData.sort((a, b) => {
        let valueA = a[column];
        let valueB = b[column];

        if (!isNaN(valueA)) {
            valueA = Number(valueA);
            valueB = Number(valueB);
        }

        if (valueA < valueB) return sortAscending ? -1 : 1;
        if (valueA > valueB) return sortAscending ? 1 : -1;
        return 0;
    });

    updateTable();
}

function setupFilters() {
    setupColumnFilters();
    setupTypeFilters();
    setupStatRanges();
    setupMiscFilters();
}

function setupColumnFilters() {
    const container = document.getElementById('column-filters');
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';

    // Add "Select All" checkbox
    const selectAllLabel = document.createElement('label');
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = 'select-all-columns';
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('#column-filters input[type="checkbox"]:not(#select-all-columns)');
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        updateColumnVisibility();
    });
    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(document.createTextNode('Select All'));
    checkboxContainer.appendChild(selectAllLabel);

    Object.keys(pokemonData[0]).forEach(column => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.column = column;
        checkbox.addEventListener('change', updateColumnVisibility);
        
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(column));
        checkboxContainer.appendChild(label);
    });

    const defaultShownColumns = [
        'Number', 'Name', 'HP', 'Attack', 'Defense', 
        'Special Attack', 'Special Defense', 'Speed',
        'Type 1', 'Type 2', 'BST', 'Head Stat Total', 'Body Stat Total'
    ];
    
    checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.id !== 'select-all-columns') {
            checkbox.checked = defaultShownColumns.includes(checkbox.dataset.column);
        }
    });
    
    container.appendChild(checkboxContainer);
    updateColumnVisibility();
}

function updateColumnVisibility() {
    const shownColumns = new Set();
    const checkboxes = document.querySelectorAll('#column-filters input[type="checkbox"]:not(#select-all-columns)');
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            shownColumns.add(checkbox.dataset.column);
        }
    });

    localStorage.setItem('shownColumns', JSON.stringify([...shownColumns]));
    applyColumnVisibility();
}

function applyColumnVisibility() {
    const shownColumns = new Set(JSON.parse(localStorage.getItem('shownColumns') || '[]'));
    const table = document.getElementById('pokemon-table');
    
    const checkboxes = document.querySelectorAll('#column-filters input[type="checkbox"]:not(#select-all-columns)');
    checkboxes.forEach(checkbox => {
        checkbox.checked = shownColumns.has(checkbox.dataset.column);
    });

    Object.keys(pokemonData[0]).forEach((column, index) => {
        const cells = table.querySelectorAll(`tr > *:nth-child(${index + 1})`);
        cells.forEach(cell => {
            cell.style.display = shownColumns.has(column) ? '' : 'none';
        });
    });
}

function setupTypeFilters() {
    const types = ['Normal', 'Grass', 'Fire', 'Water', 'Bug', 'Poison', 'Flying', 
                  'Rock', 'Ground', 'Fairy', 'Fighting', 'Psychic', 'Dark', 'Ghost', 
                  'Ice', 'Steel', 'Dragon', 'Electric'];
    const type2Types = [...types, 'None'];

    setupTypeFilterSection('include-type1-filters', types, 'include-type1');
    setupTypeFilterSection('include-type2-filters', type2Types, 'include-type2');
    setupTypeFilterSection('type1-filters', types, 'type1');
    setupTypeFilterSection('type2-filters', type2Types, 'type2');
}

function setupTypeFilterSection(containerId, types, category) {
    const container = document.getElementById(containerId);
    
    // Add "Select All" checkbox
    const selectAllLabel = document.createElement('label');
    const selectAllCheckbox = document.createElement('input');
    selectAllCheckbox.type = 'checkbox';
    selectAllCheckbox.id = `select-all-${category}`;
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = container.querySelectorAll(`input[type="checkbox"]:not(#select-all-${category})`);
        checkboxes.forEach(cb => cb.checked = e.target.checked);
        updateTable();
    });
    selectAllLabel.appendChild(selectAllCheckbox);
    selectAllLabel.appendChild(document.createTextNode('Select All'));
    container.appendChild(selectAllLabel);

    types.forEach(type => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.type = type === 'None' ? '' : type.toUpperCase();
        checkbox.dataset.category = category;
        checkbox.addEventListener('change', updateTable);
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(type));
        container.appendChild(label);
    });
}

function setupStatRanges() {
    const container = document.getElementById('stat-ranges');
    const stats = [
        { name: 'HP', min: 1, max: 255, step: 1 },
        { name: 'Attack', min: 1, max: 255, step: 1 },
        { name: 'Defense', min: 1, max: 255, step: 1 },
        { name: 'Special Attack', min: 1, max: 255, step: 1 },
        { name: 'Special Defense', min: 1, max: 255, step: 1 },
        { name: 'Speed', min: 1, max: 255, step: 1 },
        { name: 'BST', min: 1, max: 800, step: 1 },
        { name: 'Head Stat Total', min: 1, max: 800, step: 1 },
        { name: 'Body Stat Total', min: 1, max: 800, step: 1 },
        { name: 'Stat Balance', min: 0, max: 1.5, step: 0.01 },
        { name: 'Head Stat Balance', min: 0, max: 1.5, step: 0.01 },
        { name: 'Body Stat Balance', min: 0, max: 1.5, step: 0.01 }
    ];

    stats.forEach(stat => {
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';

        const label = document.createElement('label');
        label.textContent = stat.name;
        
        const rangeValues = document.createElement('div');
        rangeValues.className = 'range-values';
        
        const minInput = document.createElement('input');
        minInput.type = 'number';
        minInput.value = stat.min;
        minInput.min = stat.min;
        minInput.max = stat.max;
        minInput.step = stat.step;
        
        const maxInput = document.createElement('input');
        maxInput.type = 'number';
        maxInput.value = stat.max;
        maxInput.min = stat.min;
        maxInput.max = stat.max;
        maxInput.step = stat.step;

        [minInput, maxInput].forEach(input => {
            input.addEventListener('change', updateTable);
        });

        rangeValues.appendChild(minInput);
        rangeValues.appendChild(maxInput);
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(rangeValues);
        container.appendChild(sliderContainer);
    });
}

function setupMiscFilters() {
    document.getElementById('show-legendaries').addEventListener('change', updateTable);
    document.getElementById('first-stages').checked = false;
    document.getElementById('final-stages').checked = false;
    document.getElementById('first-stages').addEventListener('change', updateTable);
    document.getElementById('final-stages').addEventListener('change', updateTable);
}

function filterData() {
    return pokemonData.filter(pokemon => {
        // Include Types filters
        const includedType1s = [...document.querySelectorAll('#include-type1-filters input:checked:not(#select-all-include-type1)')]
            .map(cb => cb.dataset.type);
        const includedType2s = [...document.querySelectorAll('#include-type2-filters input:checked:not(#select-all-include-type2)')]
            .map(cb => cb.dataset.type);

        if (includedType1s.length > 0 || includedType2s.length > 0) {
            if (!includedType1s.includes(pokemon['Type 1']) && !includedType2s.includes(pokemon['Type 2'])) {
                return false;
            }
        }

        // Exclude Types filters
        const excludedType1s = [...document.querySelectorAll('#type1-filters input:checked:not(#select-all-type1)')]
            .map(cb => cb.dataset.type);
        const excludedType2s = [...document.querySelectorAll('#type2-filters input:checked:not(#select-all-type2)')]
            .map(cb => cb.dataset.type);

        if (excludedType1s.includes(pokemon['Type 1'])) return false;
        if (excludedType2s.includes(pokemon['Type 2'])) return false;

        // Stat range filters
        const statContainers = document.querySelectorAll('.slider-container');
        for (const container of statContainers) {
            const stat = container.querySelector('label').textContent;
            const [min, max] = [...container.querySelectorAll('input[type="number"]')]
                .map(input => parseFloat(input.value));
            const value = parseFloat(pokemon[stat]);
            if (value < min || value > max) return false;
        }

        // Misc filters
        if (!document.getElementById('show-legendaries').checked && pokemon.Legendary === 'True') return false;
        if (document.getElementById('first-stages').checked && pokemon['First Stage'] === 'False') return false;
        if (document.getElementById('final-stages').checked && pokemon['Final Stage'] === 'False') return false;

        return true;
    });
}

function toggleTreeItem(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('active');
    header.textContent = header.textContent.replace('?', '?');
    if (content.classList.contains('active')) {
        header.textContent = header.textContent.replace('?', '?');
    }
}

document.addEventListener('DOMContentLoaded', loadData);
