// script.js
let pokemonData = [];
let currentSortColumn = null;
let sortAscending = true;

// Fetch and parse CSV data
async function loadData() {
    const response = await fetch('stats.csv');
    const text = await response.text();
    const rows = text.trim().split('\n');
    const headers = rows[0].split(',');

    pokemonData = rows.slice(1).map(row => {
        const values = row.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });

    setupFilters();
    setupTable();
}

function setupTable() {
    const table = document.getElementById('pokemon-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');

    // Setup headers
    const headerRow = document.createElement('tr');
    Object.keys(pokemonData[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        th.onclick = () => sortTable(key);
        headerRow.appendChild(th);
    });
    thead.innerHTML = ''; // Clear existing headers
    thead.appendChild(headerRow);

    // Populate table
    updateTable();
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
    setupIncludeTypeFilters();
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
    selectAllCheckbox.dataset.column = 'select-all';
    selectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = checkboxContainer.querySelectorAll('input[type="checkbox"]:not([data-column="select-all"])');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAllCheckbox.checked;
        });
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

    // Set default displayed columns
    const defaultDisplayedColumns = [
        'Number', 'Name', 'HP', 'Attack', 'Defence', 'Special Attack',
        'Special Defence', 'Speed', 'Type 1', 'Type 2', 'BST',
        'Head Stat Total', 'Body Stat Total'
    ];

    checkboxContainer.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        if (checkbox.dataset.column === 'select-all') {
            // Do nothing
        } else if (defaultDisplayedColumns.includes(checkbox.dataset.column)) {
            checkbox.checked = true;
        } else {
            checkbox.checked = false;
        }
    });

    container.appendChild(checkboxContainer);
    updateColumnVisibility();
}

function updateColumnVisibility() {
    const shownColumns = new Set();
    const checkboxes = document.querySelectorAll('#column-filters input[type="checkbox"]');

    checkboxes.forEach((checkbox) => {
        if (checkbox.dataset.column === 'select-all') {
            // Do nothing
        } else if (checkbox.checked) {
            shownColumns.add(checkbox.dataset.column);
        }
    });

    // Update "Select All" checkbox based on whether all checkboxes are checked
    const selectAllCheckbox = document.querySelector('#column-filters input[data-column="select-all"]');
    const allChecked = [...checkboxes].filter(cb => cb.dataset.column !== 'select-all').every(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;

    // Store shown columns in localStorage
    localStorage.setItem('shownColumns', JSON.stringify([...shownColumns]));
    applyColumnVisibility();
}

function applyColumnVisibility() {
    const shownColumns = new Set(JSON.parse(localStorage.getItem('shownColumns') || '[]'));
    const table = document.getElementById('pokemon-table');

    // Update checkboxes to match stored state
    const checkboxes = document.querySelectorAll('#column-filters input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        if (checkbox.dataset.column === 'select-all') {
            // Do nothing
        } else {
            checkbox.checked = shownColumns.has(checkbox.dataset.column);
        }
    });

    // Update "Select All" checkbox based on whether all checkboxes are checked
    const selectAllCheckbox = document.querySelector('#column-filters input[data-column="select-all"]');
    const allChecked = [...checkboxes].filter(cb => cb.dataset.column !== 'select-all').every(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;

    // Show/hide columns
    Object.keys(pokemonData[0]).forEach((column, index) => {
        const cells = table.querySelectorAll(`tr > *:nth-child(${index + 1})`);
        cells.forEach(cell => {
            cell.style.display = shownColumns.has(column) ? '' : 'none';
        });
    });
}

function setupIncludeTypeFilters() {
    const types = ['Normal', 'Grass', 'Fire', 'Water', 'Bug', 'Poison', 'Flying', 
                  'Rock', 'Ground', 'Fairy', 'Fighting', 'Psychic', 'Dark', 'Ghost', 
                  'Ice', 'Steel', 'Dragon', 'Electric'];
    const type2Types = [...types, 'None'];

    const type1Container = document.getElementById('include-type1-filters');
    const type2Container = document.getElementById('include-type2-filters');

    // Type 1 Select All
    const type1SelectAllLabel = document.createElement('label');
    const type1SelectAllCheckbox = document.createElement('input');
    type1SelectAllCheckbox.type = 'checkbox';
    type1SelectAllCheckbox.dataset.type = 'select-all';
    type1SelectAllCheckbox.dataset.category = 'include-type1';
    type1SelectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = type1Container.querySelectorAll('input[type="checkbox"]:not([data-type="select-all"])');
        checkboxes.forEach(checkbox => {
            checkbox.checked = type1SelectAllCheckbox.checked;
        });
        updateTable();
    });
    type1SelectAllLabel.appendChild(type1SelectAllCheckbox);
    type1SelectAllLabel.appendChild(document.createTextNode('Select All'));
    type1Container.appendChild(type1SelectAllLabel);

    // Type 2 Select All
    const type2SelectAllLabel = document.createElement('label');
    const type2SelectAllCheckbox = document.createElement('input');
    type2SelectAllCheckbox.type = 'checkbox';
    type2SelectAllCheckbox.dataset.type = 'select-all';
    type2SelectAllCheckbox.dataset.category = 'include-type2';
    type2SelectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = type2Container.querySelectorAll('input[type="checkbox"]:not([data-type="select-all"])');
        checkboxes.forEach(checkbox => {
            checkbox.checked = type2SelectAllCheckbox.checked;
        });
        updateTable();
    });
    type2SelectAllLabel.appendChild(type2SelectAllCheckbox);
    type2SelectAllLabel.appendChild(document.createTextNode('Select All'));
    type2Container.appendChild(type2SelectAllLabel);

    types.forEach(type => {
        // Type 1 checkbox
        const label1 = document.createElement('label');
        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        checkbox1.dataset.type = type;
        checkbox1.dataset.category = 'include-type1';
        checkbox1.addEventListener('change', updateTable);
        label1.appendChild(checkbox1);
        label1.appendChild(document.createTextNode(type));
        type1Container.appendChild(label1);
    });

    type2Types.forEach(type => {
        const label2 = document.createElement('label');
        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.dataset.type = type === 'None' ? '' : type;
        checkbox2.dataset.category = 'include-type2';
        checkbox2.addEventListener('change', updateTable);
        label2.appendChild(checkbox2);
        label2.appendChild(document.createTextNode(type));
        type2Container.appendChild(label2);
    });
}

function setupTypeFilters() {
    const types = ['Normal', 'Grass', 'Fire', 'Water', 'Bug', 'Poison', 'Flying', 
                  'Rock', 'Ground', 'Fairy', 'Fighting', 'Psychic', 'Dark', 'Ghost', 
                  'Ice', 'Steel', 'Dragon', 'Electric'];
    const type2Types = [...types, 'None'];

    const type1Container = document.getElementById('type1-filters');
    const type2Container = document.getElementById('type2-filters');

    // Type 1 Select All
    const type1SelectAllLabel = document.createElement('label');
    const type1SelectAllCheckbox = document.createElement('input');
    type1SelectAllCheckbox.type = 'checkbox';
    type1SelectAllCheckbox.dataset.type = 'select-all';
    type1SelectAllCheckbox.dataset.category = 'type1';
    type1SelectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = type1Container.querySelectorAll('input[type="checkbox"]:not([data-type="select-all"])');
        checkboxes.forEach(checkbox => {
            checkbox.checked = type1SelectAllCheckbox.checked;
        });
        updateTable();
    });
    type1SelectAllLabel.appendChild(type1SelectAllCheckbox);
    type1SelectAllLabel.appendChild(document.createTextNode('Select All'));
    type1Container.appendChild(type1SelectAllLabel);

    // Type 2 Select All
    const type2SelectAllLabel = document.createElement('label');
    const type2SelectAllCheckbox = document.createElement('input');
    type2SelectAllCheckbox.type = 'checkbox';
    type2SelectAllCheckbox.dataset.type = 'select-all';
    type2SelectAllCheckbox.dataset.category = 'type2';
    type2SelectAllCheckbox.addEventListener('change', (e) => {
        const checkboxes = type2Container.querySelectorAll('input[type="checkbox"]:not([data-type="select-all"])');
        checkboxes.forEach(checkbox => {
            checkbox.checked = type2SelectAllCheckbox.checked;
        });
        updateTable();
    });
    type2SelectAllLabel.appendChild(type2SelectAllCheckbox);
    type2SelectAllLabel.appendChild(document.createTextNode('Select All'));
    type2Container.appendChild(type2SelectAllLabel);

    types.forEach(type => {
        // Type 1 checkbox
        const label1 = document.createElement('label');
        const checkbox1 = document.createElement('input');
        checkbox1.type = 'checkbox';
        checkbox1.dataset.type = type;
        checkbox1.dataset.category = 'type1';
        checkbox1.addEventListener('change', updateTable);
        label1.appendChild(checkbox1);
        label1.appendChild(document.createTextNode(type));
        type1Container.appendChild(label1);
    });

    type2Types.forEach(type => {
        const label2 = document.createElement('label');
        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.dataset.type = type === 'None' ? '' : type;
        checkbox2.dataset.category = 'type2';
        checkbox2.addEventListener('change', updateTable);
        label2.appendChild(checkbox2);
        label2.appendChild(document.createTextNode(type));
        type2Container.appendChild(label2);
    });
}

function setupStatRanges() {
    const container = document.getElementById('stat-ranges');
    const stats = [
        { name: 'HP', min: 1, max: 255, step: 1 },
        { name: 'Attack', min: 1, max: 255, step: 1 },
        { name: 'Defence', min: 1, max: 255, step: 1 },
        { name: 'Special Attack', min: 1, max: 255, step: 1 },
        { name: 'Special Defence', min: 1, max: 255, step: 1 },
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
    document.getElementById('first-stages').addEventListener('change', updateTable);
    document.getElementById('final-stages').addEventListener('change', updateTable);
}

function filterData() {
    const includeType1s = [...document.querySelectorAll('#include-type1-filters input:checked')]
        .filter(cb => cb.dataset.type !== 'select-all')
        .map(cb => cb.dataset.type);
    const includeType2s = [...document.querySelectorAll('#include-type2-filters input:checked')]
        .filter(cb => cb.dataset.type !== 'select-all')
        .map(cb => cb.dataset.type);

    const anyIncludeType1Checked = includeType1s.length > 0;
    const anyIncludeType2Checked = includeType2s.length > 0;

    const excludedType1s = [...document.querySelectorAll('#type1-filters input:checked')]
        .filter(cb => cb.dataset.type !== 'select-all')
        .map(cb => cb.dataset.type);
    const excludedType2s = [...document.querySelectorAll('#type2-filters input:checked')]
        .filter(cb => cb.dataset.type !== 'select-all')
        .map(cb => cb.dataset.type);

    return pokemonData.filter(pokemon => {
        // Include Types logic
        if (anyIncludeType1Checked) {
            if (!includeType1s.includes(pokemon['Type 1'])) return false;
        }
        if (anyIncludeType2Checked) {
            if (!includeType2s.includes(pokemon['Type 2'])) return false;
        }

        // Exclude Types logic
        if (excludedType1s.includes(pokemon['Type 1'])) return false;
        if (excludedType2s.includes(pokemon['Type 2'])) return false;

        // Stat range filters
        const statContainers = document.querySelectorAll('.slider-container');
        for (const container of statContainers) {
            const stat = container.querySelector('label').textContent;
            const [minInput, maxInput] = container.querySelectorAll('input[type="number"]');
            const min = parseFloat(minInput.value);
            const max = parseFloat(maxInput.value);
            const value = parseFloat(pokemon[stat]);

            if (isNaN(value)) return false;
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
}

// Initialize the page
document.addEventListener('DOMContentLoaded', loadData);
