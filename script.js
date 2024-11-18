// script.js
let pokemonData = [];
let currentSortColumn = null;
let sortAscending = true;

// Fetch and parse CSV data
async function loadData() {
    const response = await fetch('stats.csv');
    const text = await response.text();
    const rows = text.split('\n');
    const headers = rows[0].split(',');
    
    pokemonData = rows.slice(1).map(row => {
        const values = row.split(',');
        const obj = {};
        headers.forEach((header, index) => {
            obj[header] = values[index];
        });
        return obj;
    });

    setupTable();
    setupFilters();
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

// script.js (continued)

function setupColumnFilters() {
    const container = document.getElementById('column-filters');
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';

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

    container.appendChild(checkboxContainer);
}

function updateColumnVisibility() {
    const table = document.getElementById('pokemon-table');
    const checkboxes = document.querySelectorAll('#column-filters input[type="checkbox"]');
    
    checkboxes.forEach((checkbox, index) => {
        const cells = table.querySelectorAll(`tr > *:nth-child(${index + 1})`);
        cells.forEach(cell => {
            cell.style.display = checkbox.checked ? 'none' : '';
        });
    });
}

function setupTypeFilters() {
    const types = ['Normal', 'Grass', 'Fire', 'Water', 'Bug', 'Poison', 'Flying', 
                  'Rock', 'Ground', 'Fairy', 'Fighting', 'Psychic', 'Dark', 'Ghost', 
                  'Ice', 'Steel', 'Dragon'];

    const type1Container = document.getElementById('type1-filters');
    const type2Container = document.getElementById('type2-filters');

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

        // Type 2 checkbox
        const label2 = document.createElement('label');
        const checkbox2 = document.createElement('input');
        checkbox2.type = 'checkbox';
        checkbox2.dataset.type = type;
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
        { name: 'Defense', min: 1, max: 255, step: 1 },
        { name: 'Special Attack', min: 1, max: 255, step: 1 },
        { name: 'Special Defense', min: 1, max: 255, step: 1 },
        { name: 'Speed', min: 1, max: 255, step: 1 },
        { name: 'BST', min: 1, max: 800, step: 1 },
        { name: 'Head Stat Total', min: 1, max: 800, step: 1 },
        { name: 'Body Stat Total', min: 1, max: 800, step: 1 },
        { name: 'Stat Balance', min: 0, max: 1, step: 0.01 },
        { name: 'Head Stat Balance', min: 0, max: 1, step: 0.01 },
        { name: 'Body Stat Balance', min: 0, max: 1, step: 0.01 }
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

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.multiple = true;
        slider.min = stat.min;
        slider.max = stat.max;
        slider.step = stat.step;
        slider.dataset.stat = stat.name;

        // Event listeners
        [minInput, maxInput].forEach(input => {
            input.addEventListener('change', () => {
                updateTable();
            });
        });

        rangeValues.appendChild(minInput);
        rangeValues.appendChild(maxInput);
        sliderContainer.appendChild(label);
        sliderContainer.appendChild(rangeValues);
        sliderContainer.appendChild(slider);
        container.appendChild(sliderContainer);
    });
}

function setupMiscFilters() {
    document.getElementById('show-legendaries').addEventListener('change', updateTable);
    document.getElementById('first-stages').addEventListener('change', updateTable);
    document.getElementById('final-stages').addEventListener('change', updateTable);
}

function filterData() {
    return pokemonData.filter(pokemon => {
        // Type filters
        const excludedType1s = [...document.querySelectorAll('#type1-filters input:checked')]
            .map(cb => cb.dataset.type);
        const excludedType2s = [...document.querySelectorAll('#type2-filters input:checked')]
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
    header.textContent = header.textContent.replace('▼', '▶');
    if (content.classList.contains('active')) {
        header.textContent = header.textContent.replace('▶', '▼');
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', loadData);