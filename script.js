let pokemonData = [];
let originalPokemonData = [];
let currentSortColumn = null;
let sortAscending = true;

const DEFAULT_COLUMNS = [
    'Number', 'Name', 'HP', 'Attack', 'Defense', 
    'Special Attack', 'Special Defense', 'Speed',
    'Type 1', 'Type 2', 'BST', 'Head Stat Total', 'Body Stat Total'
];

const TYPE_OPTIONS = [
    '---', 'Normal', 'Grass', 'Fire', 'Water', 'Bug', 'Poison', 
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
    setupFusionSelector();
    applyFilters();
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
        const row = document.createElement('tr');
        DEFAULT_COLUMNS.forEach(key => {
            const td = document.createElement('td');
            if (key === 'Name') {
                const link = document.createElement('a');
                link.href = `https://www.fusiondex.org/${pokemon.Number}/`;
                link.textContent = pokemon[key];
                td.appendChild(link);
            } else {
                td.textContent = pokemon[key];
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
        setupFilterRuleEventsForRule(rule);
    });
}

function setupFilterRuleEventsForRule(rule) {
    rule.querySelectorAll('select, input').forEach(element => {
        element.addEventListener('change', () => {
            applyFilters();
        });
    });

    const columnSelect = rule.querySelector('.rule-column');
    columnSelect.addEventListener('change', updateConditionOptions);
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

function addRule(button) {
    const filterGroup = button.closest('.filter-group');
    const rulesContainer = filterGroup;
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'filter-rule';
    ruleDiv.innerHTML = filterGroup.querySelector('.filter-rule').innerHTML;

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Rule';
    deleteButton.onclick = () => {
        ruleDiv.remove();
        applyFilters();
    };
    ruleDiv.appendChild(deleteButton);

    const buttonsDiv = filterGroup.querySelector('.rule-buttons');
    rulesContainer.insertBefore(ruleDiv, buttonsDiv);

    setupFilterRuleEventsForRule(ruleDiv);
    applyFilters();
}

function addFilter() {
    const filterGroupsContainer = document.getElementById('filter-groups');

    const hr = document.createElement('hr');
    filterGroupsContainer.appendChild(hr);

    const filterGroup = document.createElement('div');
    filterGroup.className = 'filter-group';

    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'filter-rule';
    ruleDiv.innerHTML = document.querySelector('.filter-group .filter-rule').innerHTML;

    const deleteFilterButton = document.createElement('button');
    deleteFilterButton.textContent = 'Delete Filter';
    deleteFilterButton.onclick = () => {
        hr.remove();
        filterGroup.remove();
        applyFilters();
    };
    ruleDiv.insertBefore(deleteFilterButton, ruleDiv.firstChild);

    filterGroup.appendChild(ruleDiv);

    const ruleButtonsDiv = document.createElement('div');
    ruleButtonsDiv.className = 'rule-buttons';
    const addRuleButton = document.createElement('button');
    addRuleButton.textContent = 'Add Rule';
    addRuleButton.onclick = () => addRule(addRuleButton);
    ruleButtonsDiv.appendChild(addRuleButton);

    filterGroup.appendChild(ruleButtonsDiv);

    filterGroupsContainer.appendChild(filterGroup);

    setupFilterRuleEventsForRule(ruleDiv);
    applyFilters();
}

function toggleTreeItem(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('active');
}

function applyFilters() {
    const filters = getAllFilterRules();
    if (filters.length === 0) {
        pokemonData = [...originalPokemonData];
    } else {
        const filteredDataSets = filters.map(rules => {
            let filteredData = [...originalPokemonData];
            rules.forEach(rule => {
                filteredData = filterByRule(filteredData, rule);
            });
            return filteredData;
        });

        let combinedData = [];
        const seenNumbers = new Set();

        filteredDataSets.forEach(dataSet => {
            dataSet.forEach(pokemon => {
                if (!seenNumbers.has(pokemon.Number)) {
                    combinedData.push(pokemon);
                    seenNumbers.add(pokemon.Number);
                }
            });
        });

        pokemonData = combinedData;
    }

    applyFusion();
}

function getAllFilterRules() {
    const filtersContainer = document.getElementById('filter-groups');
    const filters = [];

    filtersContainer.querySelectorAll('.filter-group').forEach(filterGroup => {
        const rules = [];
        filterGroup.querySelectorAll('.filter-rule').forEach(ruleDiv => {
            const rule = {
                action: ruleDiv.querySelector('.rule-type').value,
                column: ruleDiv.querySelector('.rule-column').value,
                condition: ruleDiv.querySelector('.rule-condition').value,
                value: ruleDiv.querySelector('.rule-value').value
            };
            if (rule.action && rule.column && rule.condition) {
                rules.push(rule);
            }
        });
        if (rules.length > 0) {
            filters.push(rules);
        }
    });
    return filters;
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

function setupFusionSelector() {
    const input = document.getElementById('pokemon-select');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const fusionType = document.getElementById('fusion-type');
    const pokemonList = originalPokemonData.sort((a, b) => Number(a.Number) - Number(b.Number));

    let currentSelection = null;

    function selectPokemon(pokemon) {
        input.value = pokemon.Name;
        input.dataset.number = pokemon.Number;
        dropdownMenu.classList.remove('show');
        currentSelection = pokemon;
        
        // Only apply fusion if both pokemon and fusion type are selected
        if (fusionType.value) {
            pokemonData = [...originalPokemonData]; // Reset to original data
            applyFusion(); // Apply new fusion
        }
    }

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        dropdownMenu.innerHTML = '';
        
        if (query) {
            const filteredPokemon = pokemonList.filter(pokemon => 
                pokemon.Name.toLowerCase().includes(query)
            );
            
            filteredPokemon.forEach(pokemon => {
                const option = document.createElement('div');
                option.textContent = pokemon.Name;
                option.dataset.number = pokemon.Number;
                option.addEventListener('click', (e) => {
                    e.preventDefault();
                    selectPokemon(pokemon);
                });
                dropdownMenu.appendChild(option);
            });
            
            dropdownMenu.classList.add('show');
        } else {
            dropdownMenu.classList.remove('show');
            currentSelection = null;
        }
    });

    input.addEventListener('focus', () => {
        if (input.value && dropdownMenu.children.length) {
            dropdownMenu.classList.add('show');
        }
    });

    // Handle clicking outside the dropdown
    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    fusionType.addEventListener('change', () => {
        if (currentSelection && fusionType.value) {
            pokemonData = [...originalPokemonData]; // Reset to original data
            applyFusion(); // Apply new fusion
        } else if (!fusionType.value) {
            pokemonData = [...originalPokemonData]; // Reset to original data
            updateTable();
        }
    });
}

function calculateFusedStats(basePokemon, fusionPokemon, fusionType) {
    const result = {...basePokemon};
    const isHead = fusionType === 'head';

    const headStats = ['Attack', 'Defense', 'Speed'];
    const bodyStats = ['HP', 'Special Attack', 'Special Defense'];

    headStats.forEach(stat => {
        result[stat] = Math.floor(
            isHead ? 
            (2 * Number(fusionPokemon[stat]) + Number(basePokemon[stat])) / 3 :
            (2 * Number(basePokemon[stat]) + Number(fusionPokemon[stat])) / 3
        );
    });

    bodyStats.forEach(stat => {
        result[stat] = Math.floor(
            !isHead ? 
            (2 * Number(fusionPokemon[stat]) + Number(basePokemon[stat])) / 3 :
            (2 * Number(basePokemon[stat]) + Number(fusionPokemon[stat])) / 3
        );
    });

    result['BST'] = headStats.concat(bodyStats)
        .reduce((sum, stat) => sum + Number(result[stat]), 0);
    
    result['Head Stat Total'] = headStats
        .reduce((sum, stat) => sum + Number(result[stat]), 0);
    
    result['Body Stat Total'] = bodyStats
        .reduce((sum, stat) => sum + Number(result[stat]), 0);

    const headPokemon = isHead ? fusionPokemon : basePokemon;
    const bodyPokemon = isHead ? basePokemon : fusionPokemon;

    if (headPokemon['Type 1'] === 'Normal' && headPokemon['Type 2'] === 'Flying') {
        result['Type 1'] = headPokemon['Type 2'];
    } else {
        result['Type 1'] = headPokemon['Type 1'];
    }

    if (bodyPokemon['Type 2'] === result['Type 1']) {
        result['Type 2'] = bodyPokemon['Type 1'];
    } else {
        result['Type 2'] = bodyPokemon['Type 2'];
    }

    const headNum = isHead ? fusionPokemon.Number : basePokemon.Number;
    const bodyNum = isHead ? basePokemon.Number : fusionPokemon.Number;
    result.Number = `${headNum}.${bodyNum}`;

    return result;
}

function applyFusion() {
    const input = document.getElementById('pokemon-select');
    const fusionType = document.getElementById('fusion-type');

    if (input.dataset.number && fusionType.value) {
        const selectedPokemon = originalPokemonData.find(p => p.Number === input.dataset.number);

        pokemonData = pokemonData.map(pokemon => 
            calculateFusedStats(pokemon, selectedPokemon, fusionType.value)
        );
    }

    updateTable();
}

function clearFusion() {
    const input = document.getElementById('pokemon-select');
    input.value = '';
    input.dataset.number = '';
    document.getElementById('fusion-type').value = '';
    pokemonData = [...originalPokemonData]; // Reset to original data
    applyFilters(); // Reapply filters to update table
}

document.addEventListener('DOMContentLoaded', loadData);
