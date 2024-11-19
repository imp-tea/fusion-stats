let pokemonData = [];
let originalPokemonData = [];
let currentSortColumn = null;
let sortAscending = true;
let selectedPokemon = null;
let fusionType = null;
let filterGroups = [[]];
let currentFilterGroup = 0;

const DEFAULT_COLUMNS = [
    'Number', 'Name', 'HP', 'Attack', 'Defense', 
    'Special Attack', 'Special Defense', 'Speed',
    'Type 1', 'Type 2', 'BST', 'Head Stat Total', 'Body Stat Total'
];

const TYPE_OPTIONS = [
    '---', 'Any', 'Normal', 'Grass', 'Fire', 'Water', 'Bug', 'Poison', 
    'Flying', 'Rock', 'Ground', 'Fairy', 'Fighting', 'Psychic', 'Dark', 
    'Ghost', 'Ice', 'Steel', 'Dragon', 'Electric', 'None'
];

const NUMERIC_OPTIONS = [
    '---', 'Is Greater Than', 'Is Less Than', 'Is Equal To'
];

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

    originalPokemonData = [...pokemonData];
    setupTable();
    setupFilterRuleEvents();
    setupPokemonSelect(); // Add this line
    setupFusionHandlers(); // Add this line
    updateTable();
}

function setupTable() {
    const table = document.getElementById('pokemon-table');
    const thead = table.querySelector('thead');
    const headerRow = document.createElement('tr');
    
    DEFAULT_COLUMNS.forEach(key => {
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

    pokemonData.forEach(pokemon => {
        const displayPokemon = calculateFusedStats(pokemon);
        const row = document.createElement('tr');
        DEFAULT_COLUMNS.forEach(key => {
            const td = document.createElement('td');
            if (key === 'Name') {
                const link = document.createElement('a');
                link.href = `https://www.fusiondex.org/${displayPokemon.Number}/`;
                link.textContent = displayPokemon[key];
                td.appendChild(link);
            } else {
                td.textContent = displayPokemon[key];
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

function setupFilterRuleEvents() {
    document.querySelectorAll('.filter-rule').forEach(rule => {
        rule.querySelectorAll('select, input').forEach(element => {
            element.addEventListener('change', () => {
                applyFilters();
            });
        });
    });

    document.querySelectorAll('.rule-column').forEach(select => {
        select.addEventListener('change', updateConditionOptions);
    });
}

function updateConditionOptions(event) {
    const columnSelect = event.target;
    const ruleDiv = columnSelect.closest('.filter-rule');
    const conditionSelect = ruleDiv.querySelector('.rule-condition');
    const valueInput = ruleDiv.querySelector('.rule-value');
    
    conditionSelect.innerHTML = '';
    
    const options = ['Type 1', 'Type 2'].includes(columnSelect.value) 
        ? TYPE_OPTIONS 
        : NUMERIC_OPTIONS;
    
    options.forEach(option => {
        const optElement = document.createElement('option');
        optElement.value = option;
        optElement.textContent = option;
        conditionSelect.appendChild(optElement);
    });

    conditionSelect.addEventListener('change', () => {
        const showNumericInput = ['Is Greater Than', 'Is Less Than', 'Is Equal To'].includes(conditionSelect.value);
        valueInput.style.display = showNumericInput ? 'inline' : 'none';
    });
}

function addRule() {
    const rulesContainer = document.getElementById('filter-rules');
    
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'filter-rule';
    ruleDiv.innerHTML = document.querySelector('.filter-rule').innerHTML;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Rule';
    deleteButton.onclick = () => {
        ruleDiv.remove();
        applyFilters();
    };
    ruleDiv.appendChild(deleteButton);
    
    const buttonsDiv = document.querySelector('.rule-buttons');
    rulesContainer.insertBefore(ruleDiv, buttonsDiv);
    
    setupFilterRuleEvents();
    applyFilters();
}

function toggleTreeItem(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('active');
}

function applyFilters() {
    if (filterGroups.every(group => group.length === 0)) {
        pokemonData = [...originalPokemonData];
        updateTable();
        return;
    }

    // Apply each filter group to the original data and combine results
    const results = filterGroups
        .filter(group => group.length > 0)
        .map(group => {
            let filteredData = [...originalPokemonData];
            let currentResult = [];

            group.forEach((rule, index) => {
                if (index === 0) {
                    currentResult = filterByRule(filteredData, rule);
                } else {
                    // Within a group, rules are combined with AND
                    currentResult = filterByRule(currentResult, rule);
                }
            });

            return currentResult;
        });

    // Combine results from all filter groups (OR operation between groups)
    pokemonData = [...new Set(results.flat())];
    updateTable();
}

function getAllFilterRules() {
    const rulesContainer = document.getElementById('filter-rules');
    filterGroups = [[]];
    let currentGroup = 0;
    
    rulesContainer.childNodes.forEach(node => {
        if (node.tagName === 'HR') {
            filterGroups.push([]);
            currentGroup++;
        } else if (node.className === 'filter-rule') {
            const rule = {
                action: node.querySelector('.rule-type').value,
                column: node.querySelector('.rule-column').value,
                condition: node.querySelector('.rule-condition').value,
                value: node.querySelector('.rule-value').value,
                type: 'rule'
            };
            if (rule.action && rule.column && rule.condition) {
                filterGroups[currentGroup].push(rule);
            }
        }
    });
    
    // Remove empty groups
    filterGroups = filterGroups.filter(group => group.length > 0);
    return filterGroups;
}

function filterByRule(data, rule) {
    const filterFunction = pokemon => {
        const value = pokemon[rule.column];
        
        if (['Type 1', 'Type 2'].includes(rule.column)) {
            if (rule.condition === 'Any') {
                return true;
            } else if (rule.condition === 'None') {
                return !value || value === '';
            } else {
                // Case-insensitive comparison for types
                return value.toUpperCase() === rule.condition.toUpperCase();
            }
        } else {
            const numValue = Number(value);
            const ruleValue = Number(rule.value);
            
            switch (rule.condition) {
                case 'Is Greater Than':
                    return numValue > ruleValue;
                case 'Is Less Than':
                    return numValue < ruleValue;
                case 'Is Equal To':
                    return numValue === ruleValue;
                default:
                    return true;
            }
        }
    };

    return rule.action === 'exclude' 
        ? data.filter(pokemon => !filterFunction(pokemon))
        : data.filter(filterFunction);
}

function setupPokemonSelect() {
    const select = document.getElementById('pokemon-select');
    const uniqueNames = [...new Set(originalPokemonData.map(p => p.Name))];
    
    uniqueNames.sort((a, b) => {
        const numA = parseInt(originalPokemonData.find(p => p.Name === a).Number);
        const numB = parseInt(originalPokemonData.find(p => p.Name === b).Number);
        return numA - numB;
    });

    uniqueNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });

    // Add search functionality
    select.addEventListener('keyup', (e) => {
        const input = e.target.value.toLowerCase();
        Array.from(select.options).forEach(option => {
            const text = option.text.toLowerCase();
            option.style.display = text.includes(input) ? '' : 'none';
        });
    });
}

function calculateFusedStats(baseRow) {
    if (!selectedPokemon || !fusionType) return baseRow;

    const basePokemon = originalPokemonData.find(p => p.Name === selectedPokemon);
    if (!basePokemon) return baseRow;

    const result = {...baseRow};
    const isHead = fusionType === 'head';
    const headPokemon = isHead ? basePokemon : baseRow;
    const bodyPokemon = isHead ? baseRow : basePokemon;

    // Calculate stats
    const headStats = ['Attack', 'Defense', 'Speed'];
    const bodyStats = ['HP', 'Special Attack', 'Special Defense'];

    headStats.forEach(stat => {
        result[stat] = Math.floor((2 * headPokemon[stat] + bodyPokemon[stat]) / 3);
    });

    bodyStats.forEach(stat => {
        result[stat] = Math.floor((2 * bodyPokemon[stat] + headPokemon[stat]) / 3);
    });

    // Calculate totals
    result['BST'] = ['HP', 'Attack', 'Defense', 'Special Attack', 'Special Defense', 'Speed']
        .reduce((sum, stat) => sum + parseInt(result[stat]), 0);
    
    result['Head Stat Total'] = headStats
        .reduce((sum, stat) => sum + parseInt(result[stat]), 0);
    
    result['Body Stat Total'] = bodyStats
        .reduce((sum, stat) => sum + parseInt(result[stat]), 0);

    // Calculate types
    const calculateType1 = () => {
        if (headPokemon['Type 1'] === 'Normal' && headPokemon['Type 2'] === 'Flying') {
            return headPokemon['Type 2'];
        }
        return headPokemon['Type 1'];
    };

    const type1 = calculateType1();
    result['Type 1'] = type1;

    const calculateType2 = () => {
        if (bodyPokemon['Type 2'] === type1) {
            return bodyPokemon['Type 1'];
        }
        return bodyPokemon['Type 2'] || bodyPokemon['Type 1'];
    };

    result['Type 2'] = calculateType2();

    // Update number and URL
    result['Number'] = `${headPokemon['Number']}.${bodyPokemon['Number']}`;

    return result;
}

function setupFusionHandlers() {
    document.getElementById('pokemon-select').addEventListener('change', (e) => {
        selectedPokemon = e.target.value;
        applyFusion();
    });

    document.getElementById('fusion-type').addEventListener('change', (e) => {
        fusionType = e.target.value;
        applyFusion();
    });
}

function clearFusion() {
    document.getElementById('pokemon-select').value = '';
    document.getElementById('fusion-type').value = '';
    selectedPokemon = null;
    fusionType = null;
    applyFilters();
}

function applyFusion() {
    if (selectedPokemon && fusionType) {
        applyFilters();
    }
}

function addNewFilter() {
    filterGroups.push([]);
    currentFilterGroup = filterGroups.length - 1;
    
    const rulesContainer = document.getElementById('filter-rules');
    const hr = document.createElement('hr');
    rulesContainer.insertBefore(hr, document.querySelector('.rule-buttons'));
    
    addRule();
}

document.addEventListener('DOMContentLoaded', loadData);
