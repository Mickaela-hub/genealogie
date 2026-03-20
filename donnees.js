/**
 * LOGIQUE DE SAISIE ET GESTION DES DONNÉES - donnees.js
 */

document.addEventListener('DOMContentLoaded', () => {
    displayTable();

    // Écouteur pour le formulaire
    document.getElementById('genea-form').addEventListener('submit', function(e) {
        e.preventDefault();
        savePerson();
    });

    // --- AJOUTER CECI POUR L'IMPORT ---
    const fileInput = document.getElementById('upload-csv');
    if (fileInput) {
        fileInput.addEventListener('change', importData);
    }
});

/**
 * FONCTIONS DE FORMATAGE AUTOMATIQUE
 */
function formatPrenom(str) {
    if (!str) return "";
    // "élise" -> "Élise" (Majuscule au début de chaque mot, gère les traits d'union)
    return str.trim().toLowerCase().replace(/(^|\s|-)\S/g, (match) => match.toUpperCase());
}

function formatNom(str) {
    if (!str) return "";
    // "gérard" -> "GÉRARD" (Tout en majuscule)
    return str.trim().toUpperCase();
}

/**
 * Affiche la liste des ancêtres dans le tableau HTML
 */
function displayTable() {
    const data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    const tbody = document.getElementById('data-body');
    if (!tbody) return;
    tbody.innerHTML = "";

    // Tri par numéro SOSA
    data.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    data.forEach(p => {
        const tr = document.createElement('tr');
        const isUnknown = p.nom === "INCONNU";
        const rowStyle = isUnknown ? "style='color: #888; font-style: italic;'" : "";
        
        tr.innerHTML = `
            <td ${rowStyle}><strong>${p.id}</strong></td>
            <td ${rowStyle}>${p.prenom || ''}</td>
            <td ${rowStyle}>${p.nom || ''}</td>
            <td ${rowStyle}>${p.metier || '-'}</td>
            <td class="actions-btns">
                <button class="edit-btn" onclick="editPerson('${p.id}')">Modifier</button>
                <button class="del-btn" onclick="deletePerson('${p.id}')">Supprimer</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * Enregistre une fiche avec formatage et chaînons manquants
 */
function savePerson() {
    // 1. Récupération
    const idStr = document.getElementById('p-id').value.trim();
    const rawPrenom = document.getElementById('p-prenom').value.trim();
    const rawNom = document.getElementById('p-nom').value.trim();
    const genre = document.getElementById('p-genre').value;
    const naissance = document.getElementById('p-naissance').value.trim();
    const deces = document.getElementById('p-deces').value.trim();

    // 2. Validations
    if (!idStr || parseInt(idStr) <= 0) return alert("⚠️ Numéro SOSA invalide.");
    if (!rawPrenom || !rawNom) return alert("⚠️ Le prénom et le nom sont obligatoires.");
    if (!genre) return alert("⚠️ Le genre est obligatoire.");

    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (naissance !== "" && !dateRegex.test(naissance)) return alert("⚠️ Format naissance : JJ/MM/AAAA");
    if (deces !== "" && !dateRegex.test(deces)) return alert("⚠️ Format décès : JJ/MM/AAAA");

    // 3. Formatage automatique
    const prenom = formatPrenom(rawPrenom);
    const nom = formatNom(rawNom);
    const villeN = formatPrenom(document.getElementById('p-lieu-n').value);
    const villeD = formatPrenom(document.getElementById('p-lieu-d').value);
    const metier = formatPrenom(document.getElementById('p-metier').value);
    const residence = formatPrenom(document.getElementById('p-residence').value);

    let data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    const targetId = parseInt(idStr);

    // 4. Gestion des ancêtres manquants (SOSA)
    let currentId = targetId;
    while (currentId > 1) {
        let parentId = Math.floor(currentId / 2);
        const parentExists = data.find(p => parseInt(p.id) === parentId);
        
        if (!parentExists && parentId >= 1) {
            data.push({
                id: parentId.toString(),
                prenom: "",
                nom: "INCONNU",
                genre: (parentId % 2 === 0) ? "H" : "F",
                metier: "Généré automatiquement",
                naissance: "", lieu_n: "", deces: "", lieu_d: "", residence: ""
            });
        }
        currentId = parentId;
    }

    // 5. Doublon / Remplacement
    const existingIndex = data.findIndex(item => item.id.toString() === idStr);
    const personObj = { id: idStr, prenom, nom, genre, metier, naissance, lieu_n: villeN, deces, lieu_d: villeD, residence };

    if (existingIndex !== -1) {
        if (!confirm(`Remplacer la fiche SOSA ${idStr} (${data[existingIndex].prenom} ${data[existingIndex].nom}) ?`)) return;
        data[existingIndex] = personObj;
    } else {
        data.push(personObj);
    }

    // 6. Sauvegarde
    data.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    localStorage.setItem('maGenealogie', JSON.stringify(data));
    
    resetForm();
    displayTable();
    alert(`✅ ${prenom} ${nom} enregistré !`);
}

/**
 * Charge une fiche pour modification
 */
function editPerson(id) {
    const data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    const p = data.find(item => item.id.toString() === id.toString());

    if (p) {
        document.getElementById('p-id').value = p.id;
        document.getElementById('p-genre').value = p.genre;
        document.getElementById('p-prenom').value = p.prenom || "";
        document.getElementById('p-nom').value = p.nom || "";
        document.getElementById('p-metier').value = p.metier || "";
        document.getElementById('p-naissance').value = p.naissance || "";
        document.getElementById('p-lieu-n').value = p.lieu_n || "";
        document.getElementById('p-deces').value = p.deces || "";
        document.getElementById('p-lieu-d').value = p.lieu_d || "";
        document.getElementById('p-residence').value = p.residence || "";
        
        document.getElementById('form-title').innerText = "Modifier la fiche Sosa n°" + id;
        window.scrollTo(0, 0);
    }
}

/**
 * Supprime une fiche et nettoie les "INCONNU" isolés
 */
function deletePerson(id) {
    if (!confirm(`Voulez-vous supprimer l'ancêtre Sosa n°${id} ?`)) return;

    let data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    data = data.filter(item => item.id.toString() !== id.toString());

    // Nettoyage des fiches INCONNU sans liens
    let cleaning = true;
    while (cleaning) {
        cleaning = false;
        const inconnus = data.filter(p => p.nom === "INCONNU");
        for (let p of inconnus) {
            const cId = parseInt(p.id);
            const hasDescendant = data.some(d => Math.floor(parseInt(d.id) / 2) === cId);
            const hasAncestors = data.some(a => parseInt(a.id) === cId * 2 || parseInt(a.id) === cId * 2 + 1);

            if (cId === 1 && data.length > 0) continue; 

            if (!hasDescendant && !hasAncestors) {
                data = data.filter(x => x.id !== p.id);
                cleaning = true;
                break;
            }
        }
    }

    localStorage.setItem('maGenealogie', JSON.stringify(data));
    displayTable();
}

function resetForm() {
    document.getElementById('genea-form').reset();
    document.getElementById('form-title').innerText = "Ajouter / Modifier un Ancêtre";
}

// Dans donnees.js, assurez-vous que cette fonction correspond au bouton du menu
function clearAllData() {
    if (confirm("⚠️ Voulez-vous vraiment supprimer TOUTE la base de données ? Cette action est irréversible.")) {
        localStorage.removeItem('maGenealogie');
        displayTable();
        resetForm();
        // Optionnel : fermer le menu après l'action
        document.getElementById('menu-toggle').checked = false;
    }
}

function exportData() {
    const data = localStorage.getItem('maGenealogie');
    if (!data || data === "[]") return alert("Aucune donnée à exporter.");
    
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `genealogie_sauvegarde_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

/**
 * EXPORT MODÈLE EXCEL
 */
function exportModelExcel() {
    const modelData = [
        { id: 1, prenom: "Élise", nom: "GÉRARD", genre: "F", naissance: "23/04/2002", lieu_n: "Paris", deces: "", lieu_d: "", metier: "Étudiante", residence: "Fresnes" },
        { id: 2, prenom: "Jean", nom: "GÉRARD", genre: "H", naissance: "15/05/1975", lieu_n: "Lille", deces: "", lieu_d: "", metier: "Ingénieur", residence: "Valenciennes" },
        { id: 3, prenom: "Marie", nom: "MARTIN", genre: "F", naissance: "10/02/1978", lieu_n: "Lyon", deces: "", lieu_d: "", metier: "Enseignante", residence: "Valenciennes" }
    ];
    const worksheet = XLSX.utils.json_to_sheet(modelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Généalogie");
    XLSX.writeFile(workbook, "modele_genealogie_complet.xlsx");
}

/**
 * GÉNÉRATION LIVRE DE FAMILLE (WORD) AVEC STATISTIQUES ET FORMATAGE PRÉCISION
 */
async function generateFamilyBook() {
    const data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    if (data.length === 0) return alert("Aucune donnée à exporter.");

    const lib = window.docx;
    if (!lib) return alert("Bibliothèque docx non chargée.");

    const children = [];

    // --- 1. PAGE DE GARDE ---
    children.push(new lib.Paragraph({
        children: [new lib.TextRun({ 
            text: "LIVRE DE GÉNÉALOGIE", 
            bold: true, 
            size: 80, 
            color: "1B263B", 
            font: "Georgia" 
        })],
        alignment: lib.AlignmentType.CENTER,
        spacing: { before: 2000, after: 500 }
    }));

    children.push(new lib.Paragraph({
        children: [new lib.TextRun({ 
            text: `Édition du ${new Date().toLocaleDateString('fr-FR')}`, 
            italic: true, 
            size: 28, 
            color: "C5A059" 
        })],
        alignment: lib.AlignmentType.CENTER,
        spacing: { after: 2000 }
    }));

    children.push(new lib.Paragraph({ children: [new lib.PageBreak()] }));

    // --- 2. TABLE DES MATIÈRES (SOMMAIRE) ---
    children.push(new lib.Paragraph({
        children: [new lib.TextRun({ text: "TABLE DES MATIÈRES", bold: true, size: 40, color: "1B263B", font: "Georgia" })],
        alignment: lib.AlignmentType.CENTER,
        spacing: { after: 600 }
    }));

    const sortedData = data.sort((a, b) => parseInt(a.id) - parseInt(b.id));

    sortedData.forEach((p) => {
        // CORRECTION MAJUSCULES SOMMAIRE : Prénom tel quel, NOM en MAJUSCULES
        const prenomTable = p.prenom || "";
        const nomTable = (p.nom || "ANONYME").toUpperCase();

        children.push(new lib.Paragraph({
            children: [
                new lib.TextRun({ text: `Sosa ${p.id} : `, bold: true, color: "C5A059" }),
                new lib.TextRun({ text: `${prenomTable} ${nomTable}`, color: "1B263B" })
            ],
            spacing: { after: 120 },
            indent: { left: 720 }
        }));
    });

    children.push(new lib.Paragraph({ children: [new lib.PageBreak()] }));

    // --- 3. LES FICHES DÉTAILLÉES ---
    sortedData.forEach((p) => {
        // CORRECTION MAJUSCULES FICHE : Prénom tel quel, NOM en MAJUSCULES
        const prenomPropre = p.prenom || ""; 
        const nomMajuscule = (p.nom || "ANONYME").toUpperCase();

        children.push(new lib.Paragraph({
            heading: lib.HeadingLevel.HEADING_1,
            alignment: lib.AlignmentType.LEFT,
            border: { bottom: { color: "C5A059", space: 1, style: lib.BorderStyle.SINGLE, size: 12 } },
            children: [
                new lib.TextRun({ 
                    text: `${prenomPropre} ${nomMajuscule}`, 
                    bold: true, 
                    size: 36, 
                    color: "1B263B", 
                    font: "Georgia" 
                })
            ],
            spacing: { before: 400, after: 200 }
        }));

        children.push(new lib.Paragraph({
            children: [new lib.TextRun({ text: `SOSA N°${p.id}`, bold: true, color: "C5A059", size: 24 })],
            spacing: { after: 400 }
        }));

        const createDetail = (icon, label, value) => {
            return new lib.Paragraph({
                children: [
                    new lib.TextRun({ text: `${icon} ${label} : `, bold: true, color: "444444", size: 22 }),
                    new lib.TextRun({ text: value || "Non renseigné", color: "000000", size: 22 })
                ],
                spacing: { after: 150 },
                indent: { left: 400 }
            });
        };

        children.push(createDetail("📂", "Profession", p.metier));
        children.push(createDetail("✨", "Naissance", `${p.naissance || "..."} ${p.lieu_n ? "à " + p.lieu_n : ""}`));
        children.push(createDetail("💍", "Mariage", `${p.mariage || "..."} ${p.lieu_m ? "à " + p.lieu_m : ""}`));
        children.push(createDetail("🕯️", "Décès", `${p.deces || "..."} ${p.lieu_d ? "à " + p.lieu_d : ""}`));
        children.push(createDetail("🏠", "Résidence", p.residence));
        
        children.push(new lib.Paragraph({ children: [new lib.PageBreak()] }));
    });

    // --- 4. ANALYSE STATISTIQUE ---
    const getTopOccurence = (array) => {
        const filtered = array.filter(v => v && v.trim() !== "" && v.toLowerCase() !== "inconnu" && v.toLowerCase() !== "non renseigné");
        if (filtered.length === 0) return "Aucune donnée";
        const counts = {};
        filtered.forEach(v => counts[v] = (counts[v] || 0) + 1);
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
        return `${top[0]} (${top[1]} fois)`;
    };

    children.push(new lib.Paragraph({
        children: [new lib.TextRun({ text: "ANALYSE STATISTIQUE", bold: true, size: 40, color: "1B263B", font: "Georgia" })],
        alignment: lib.AlignmentType.CENTER,
        spacing: { before: 400, after: 600 }
    }));

    const statsList = [
        { label: "Nombre total d'ancêtres", val: data.length },
        { label: "Métier le plus fréquent", val: getTopOccurence(data.map(p => p.metier)) },
        { label: "Ville de naissance principale", val: getTopOccurence(data.map(p => p.lieu_n)) },
        { label: "Ville de mariage principale", val: getTopOccurence(data.map(p => p.lieu_m)) },
        { label: "Ville de décès principale", val: getTopOccurence(data.map(p => p.lieu_d)) },
        { label: "Dernière résidence connue", val: getTopOccurence(data.map(p => p.residence)) }
    ];

    statsList.forEach(s => {
        children.push(new lib.Paragraph({
            children: [
                new lib.TextRun({ text: `${s.label} : `, bold: true, color: "444444", size: 24 }),
                new lib.TextRun({ text: String(s.val), color: "C5A059", bold: true, size: 24 })
            ],
            spacing: { after: 200 },
            alignment: lib.AlignmentType.CENTER
        }));
    });

    // --- 5. EXPORT FINAL ---
    const doc = new lib.Document({
        sections: [{
            properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
            children: children,
        }],
    });

    try {
        const blob = await lib.Packer.toBlob(doc);
        saveAs(blob, `Livre_Genealogique_${new Date().getFullYear()}.docx`);
    } catch (err) {
        console.error("Erreur lors de la sauvegarde :", err);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "Livre_Genealogique.docx";
        a.click();
    }
}

/**
 * IMPORTATION DES DONNÉES (JSON ou Excel)
 */
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    reader.onload = function(e) {
        let importedData = [];

        try {
            if (fileName.endsWith('.json')) {
                // Lecture JSON
                importedData = JSON.parse(e.target.result);
            } 
            else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                // Lecture Excel (nécessite la bibliothèque XLSX déjà utilisée pour l'export)
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                importedData = XLSX.utils.sheet_to_json(firstSheet);
            }

            if (Array.isArray(importedData)) {
                if (confirm(`Importer ${importedData.length} ancêtres ? Cela fusionnera avec vos données actuelles.`)) {
                    let currentData = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
                    
                    // Fusion intelligente : on remplace si le SOSA existe, sinon on ajoute
                    importedData.forEach(newP => {
                        const index = currentData.findIndex(p => String(p.id) === String(newP.id));
                        if (index !== -1) {
                            currentData[index] = newP;
                        } else {
                            currentData.push(newP);
                        }
                    });

                    localStorage.setItem('maGenealogie', JSON.stringify(currentData));
                    displayTable();
                    alert("✅ Importation réussie !");
                }
            }
        } catch (err) {
            alert("❌ Erreur lors de la lecture du fichier : " + err.message);
        }
        // Reset de l'input pour pouvoir ré-importer le même fichier si besoin
        event.target.value = '';
    };

    if (fileName.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}