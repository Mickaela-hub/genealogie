/**
 * LOGIQUE DU GESTIONNAIRE - gestionnaire.js
 */

window.addEventListener('load', () => {
    refreshDisplay();
    setupSearch();
});

function refreshDisplay() {
    const savedData = localStorage.getItem('maGenealogie');
    if (savedData) {
        afficherFiches(JSON.parse(savedData));
    }
}

/**
 * RECHERCHE MULTI-CRITÈRES
 */
function setupSearch() {
    const searchInput = document.getElementById('search-ancetre');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const savedData = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
        
        if (term === "") {
            afficherFiches(savedData);
        } else {
            const filtered = savedData.filter(p => {
                const searchString = [
                    p.id || "",
                    p.prenom || "", 
                    p.nom || "", 
                    p.metier || "", 
                    p.lieu_n || "", 
                    p.lieu_d || "", 
                    p.residence || ""
                ].join(' ').toLowerCase();

                return searchString.includes(term);
            });
            afficherFiches(filtered);
        }
    });
}

/**
 * AFFICHAGE DES FICHES PAR GÉNÉRATION - VERSION CORRIGÉE
 */
function afficherFiches(data) {
    const grid = document.getElementById('fiches-grid');
    if (!grid) return;
    grid.innerHTML = "";

    if (!data || data.length === 0) {
        grid.innerHTML = '<div class="empty-msg"><p>Aucun ancêtre trouvé dans la base.</p></div>';
        return;
    }

    // Calcul de la génération et tri par Sosa
    const dataWithGen = data.map(p => ({
        ...p,
        calculatedGen: Math.floor(Math.log2(parseInt(p.id) || 1)) + 1
    })).sort((a, b) => parseInt(a.id) - parseInt(b.id));

    // Groupement par génération via D3
    const groups = d3.group(dataWithGen, d => d.calculatedGen);
    const sortedGens = Array.from(groups.keys()).sort((a, b) => a - b);

    sortedGens.forEach(gen => {
        // 1. Création du groupe global pour la génération
        const genGroup = document.createElement('div');
        genGroup.className = "generation-group";

        // 2. Création du titre (ex: Génération 3)
        const title = document.createElement('h2');
        title.className = "generation-title";
        title.innerText = `Génération ${gen}`;
        genGroup.appendChild(title);

        // 3. Création de la section qui contient les fiches (avec la ligne de séparation CSS)
        const section = document.createElement('div');
        section.className = "generation-section";

        groups.get(gen).forEach(p => {
            const card = document.createElement('div');
            const isInconnu = p.nom === "INCONNU";
            card.className = `fiche-detaillee ${p.genre === 'F' ? 'genre-f' : 'genre-h'} ${isInconnu ? 'fiche-inconnue' : ''}`;
            
            const nomComplet = `${p.prenom || ""} ${p.nom || "Nom inconnu"}`.trim();

            card.innerHTML = `
                <div class="card-header">
                    <span class="sosa-number">Sosa n°${p.id}</span>
                    <button class="mini-edit-btn" onclick="allerModifier('${p.id}')" title="Modifier">✏️</button>
                </div>
                <div class="photo-cercle">${p.genre === 'F' ? '👑' : '🎩'}</div>
                <div class="info-content">
                    <h2>${nomComplet}</h2>
                    <p class="metier"><strong>${p.metier || "—"}</strong></p>
                    <div class="dates">
                        <p>👶 ${p.naissance || '...'} ${p.lieu_n ? 'à ' + p.lieu_n : ''}</p>
                        <p>✝️ ${p.deces || '...'} ${p.lieu_d ? 'à ' + p.lieu_d : ''}</p>
                    </div>
                </div>`;
            section.appendChild(card);
        });

        genGroup.appendChild(section);
        grid.appendChild(genGroup);
    });
}

/**
 * FILTRE PAR GÉNÉRATION - VERSION MISE À JOUR
 */
function filterByGeneration() {
    const filterEl = document.getElementById('filter-gen');
    if (!filterEl) return;
    
    const selectedGen = filterEl.value; // Valeur du select (ex: "3" ou "all")
    const groups = document.querySelectorAll('.generation-group');

    groups.forEach(group => {
        // On récupère le titre pour savoir de quelle génération il s'agit
        const titleEl = group.querySelector('.generation-title');
        if (!titleEl) return;

        // On extrait le chiffre du texte "Génération X"
        const currentGenNum = titleEl.innerText.replace(/Génération\s+/i, '').trim();

        if (selectedGen === "all" || selectedGen === currentGenNum) {
            group.style.display = "block"; // On affiche tout le bloc (titre + fiches)
        } else {
            group.style.display = "none";  // On cache tout le bloc
        }
    });
}

/**
 * Redirection vers la page de saisie pour modifier un ancêtre
 */
function allerModifier(id) {
    // On peut imaginer stocker l'ID à modifier dans le sessionStorage 
    // pour que donnees.html l'ouvre automatiquement
    sessionStorage.setItem('editSosaId', id);
    window.location.href = "donnees.html";
}