let pokemonData = [];
let originalPokemonData = [];
let currentSortColumn = null;
let sortAscending = true;
let selectedPokemon = null;
let fusionType = null;

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
    updateTable();
    populatePokemonSelect();
    setupFusionEvents();
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

function addNewFilter() {
    const rulesContainer = document.getElementById('filter-rules');
    const separator = document.createElement('hr');
    separator.className = 'filter-separator';
    
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'filter-rule';
    ruleDiv.innerHTML = document.querySelector('.filter-rule').innerHTML;
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete Rule';
    deleteButton.onclick = () => {
        separator.remove();
        ruleDiv.remove();
        applyFilters();
    };
    ruleDiv.appendChild(deleteButton);
    
    const buttonsDiv = document.querySelector('.rule-buttons');
    rulesContainer.insertBefore(separator, buttonsDiv);
    rulesContainer.insertBefore(ruleDiv, buttonsDiv);
    
    setupFilterRuleEvents();
    applyFilters();
}

function toggleTreeItem(header) {
    const content = header.nextElementSibling;
    content.classList.toggle('active');
}

function applyFilters() {
    const rules = getAllFilterRules();
    if (rules.length === 0) {
        pokemonData = [...originalPokemonData];
        updateTable();
        return;
    }

    let filteredData = [...originalPokemonData];
    let currentGroup = [];
    let currentOperator = 'AND';

    rules.forEach((rule, index) => {
        if (rule.type === 'operator') {
            currentOperator = rule.value;
        } else {
            const ruleResult = filterByRule(filteredData, rule);
            
            if (currentGroup.length === 0) {
                currentGroup = ruleResult;
            } else {
                if (currentOperator === 'AND') {
                    currentGroup = currentGroup.filter(pokemon => 
                        ruleResult.includes(pokemon));
                } else if (currentOperator === 'OR') {
                    currentGroup = [...new Set([...currentGroup, ...ruleResult])];
                }
            }
        }
    });

    pokemonData = currentGroup;
    updateTable();
}

function getAllFilterRules() {
    const rulesContainer = document.getElementById('filter-rules');
    const rules = [];
    
    rulesContainer.childNodes.forEach(node => {
        if (node.className === 'filter-rule') {
            const rule = {
                action: node.querySelector('.rule-type').value,
                column: node.querySelector('.rule-column').value,
                condition: node.querySelector('.rule-condition').value,
                value: node.querySelector('.rule-value').value,
                type: 'rule'
            };
            if (rule.action && rule.column && rule.condition) {
                rules.push(rule);
            }
        } else if (node.className === 'logical-operator') {
            rules.push({
                type: 'operator',
                value: node.textContent.replace(/-/g, '').trim()
            });
        }
    });
    
    return rules;
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

// Add this function to populate the Pokemon dropdown
function populatePokemonSelect() {
    const select = document.getElementById('pokemon-select');
    const sortedPokemon = [...originalPokemonData].sort((a, b) => 
        Number(a.Number) - Number(b.Number)
    );
    
    sortedPokemon.forEach(pokemon => {
        const option = document.createElement('option');
        option.value = pokemon.Number;
        option.textContent = `${pokemon.Name} (#${pokemon.Number})`;
        select.appendChild(option);
    });

    // Add search functionality
    select.addEventListener('keyup', (e) => {
        const searchText = e.target.value.toLowerCase();
        Array.from(select.options).forEach(option => {
            const text = option.textContent.toLowerCase();
            option.style.display = text.includes(searchText) ? '' : 'none';
        });
    });
}

// Add fusion calculation functions
function calculateHeadStat(headStat, bodyStat) {
    return Math.floor((2 * Number(headStat) + Number(bodyStat)) / 3);
}

function calculateBodyStat(bodyStat, headStat) {
    return Math.floor((2 * Number(bodyStat) + Number(headStat)) / 3);
}

function calculateTypes(headPokemon, bodyPokemon) {
    let type1 = headPokemon['Type 1'];
    if (headPokemon['Type 1'] === 'NORMAL' && headPokemon['Type 2'] === 'FLYING') {
        type1 = headPokemon['Type 2'];
    }

    let type2 = bodyPokemon['Type 2'];
    if (bodyPokemon['Type 2'] === type1 || !bodyPokemon['Type 2']) {
        type2 = bodyPokemon['Type 1'];
    }

    return [type1, type2];
}

// Add fusion application function
function applyFusion() {
    if (!selectedPokemon || !fusionType) {
        pokemonData = [...originalPokemonData];
        updateTable();
        return;
    }

    const fusionPokemon = originalPokemonData.find(p => p.Number === selectedPokemon);
    
    pokemonData = originalPokemonData.map(pokemon => {
        const fusedPokemon = {...pokemon};
        
        if (fusionType === 'head') {
            // Fusion with selected Pokemon as head
            fusedPokemon.Attack = calculateHeadStat(fusionPokemon.Attack, pokemon.Attack);
            fusedPokemon.Defense = calculateHeadStat(fusionPokemon.Defense, pokemon.Defense);
            fusedPokemon.Speed = calculateHeadStat(fusionPokemon.Speed, pokemon.Speed);
            fusedPokemon.HP = calculateBodyStat(pokemon.HP, fusionPokemon.HP);
            fusedPokemon['Special Attack'] = calculateBodyStat(pokemon['Special Attack'], fusionPokemon['Special Attack']);
            fusedPokemon['Special Defense'] = calculateBodyStat(pokemon['Special Defense'], fusionPokemon['Special Defense']);
            
            const [type1, type2] = calculateTypes(fusionPokemon, pokemon);
            fusedPokemon['Type 1'] = type1;
            fusedPokemon['Type 2'] = type2;
            
            fusedPokemon.Number = `${fusionPokemon.Number}.${pokemon.Number}`;
        } else {
            // Fusion with selected Pokemon as body
            fusedPokemon.Attack = calculateHeadStat(pokemon.Attack, fusionPokemon.Attack);
            fusedPokemon.Defense = calculateHeadStat(pokemon.Defense, fusionPokemon.Defense);
            fusedPokemon.Speed = calculateHeadStat(pokemon.Speed, fusionPokemon.Speed);
            fusedPokemon.HP = calculateBodyStat(fusionPokemon.HP, pokemon.HP);
            fusedPokemon['Special Attack'] = calculateBodyStat(fusionPokemon['Special Attack'], pokemon['Special Attack']);
            fusedPokemon['Special Defense'] = calculateBodyStat(fusionPokemon['Special Defense'], pokemon['Special Defense']);
            
            const [type1, type2] = calculateTypes(pokemon, fusionPokemon);
            fusedPokemon['Type 1'] = type1;
            fusedPokemon['Type 2'] = type2;
            
            fusedPokemon.Number = `${pokemon.Number}.${fusionPokemon.Number}`;
        }

        // Recalculate totals
        fusedPokemon.BST = Number(fusedPokemon.HP) + 
            Number(fusedPokemon.Attack) + 
            Number(fusedPokemon.Defense) + 
            Number(fusedPokemon['Special Attack']) + 
            Number(fusedPokemon['Special Defense']) + 
            Number(fusedPokemon.Speed);

        fusedPokemon['Head Stat Total'] = Number(fusedPokemon.Attack) + 
            Number(fusedPokemon.Defense) + 
            Number(fusedPokemon.Speed);

        fusedPokemon['Body Stat Total'] = Number(fusedPokemon.HP) + 
            Number(fusedPokemon['Special Attack']) + 
            Number(fusedPokemon['Special Defense']);

        return fusedPokemon;
    });

    updateTable();
}

// Add event listeners for fusion selectors
function setupFusionEvents() {
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
    pokemonData = [...originalPokemonData];
    updateTable();
}

document.addEventListener('DOMContentLoaded', loadData);
