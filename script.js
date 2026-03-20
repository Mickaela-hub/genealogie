/**
 * LOGIQUE GÉNÉRALE, ARBRE & EXPORT - script.js
 */

let currentData = null;
let currentDirection = 'V'; // 'H' pour Horizontal, 'V' pour Vertical
let currentOrientation = 'B'; // 'L': Left, 'R': Right, 'T': Top, 'B': Bottom

window.addEventListener('load', () => {
    const savedData = localStorage.getItem('maGenealogie');
    if (savedData) {
        currentData = JSON.parse(savedData);
        updateStats(); 
        if (document.getElementById('tree-container')) {
            drawTree();
        }
    }
    
    const fileInput = document.getElementById('upload-csv');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileUpload(file);
        });
    }
});

/**
 * FONCTIONS DE FORMATAGE (Nécessaires pour l'import propre)
 */
function formatPrenom(str) {
    if (!str || typeof str !== 'string') return str || "";
    return str.trim().toLowerCase().replace(/(^|\s|-)\S/g, (match) => match.toUpperCase());
}

function formatNom(str) {
    if (!str || typeof str !== 'string') return str || "";
    return str.trim().toUpperCase();
}

/**
 * COMPTEUR D'ANCÊTRES
 */
function updateStats() {
    const countEl = document.getElementById('stat-count');
    if (countEl && currentData) {
        countEl.innerText = currentData.length;
    }
}

/**
 * IMPORTATION AVEC NETTOYAGE AUTOMATIQUE & FUSION
 */
function handleFileUpload(file) {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();
    const isJSON = fileName.endsWith('.json');
    
    if (isJSON) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }

    reader.onload = function(event) {
        try {
            let rawImportedData;
            if (isJSON) {
                rawImportedData = JSON.parse(event.target.result);
            } else {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                // raw: false est important pour récupérer du texte
                rawImportedData = XLSX.utils.sheet_to_json(firstSheet, { raw: false });
            }

            // --- NETTOYAGE STRICT (CORRIGÉ POUR LE MARIAGE) ---
const cleanedData = rawImportedData.map(row => {
    const safeFormat = (val) => {
        if (val === undefined || val === null) return "";
        const str = String(val).trim();
        if (str === "") return "";
        return str.toLowerCase().replace(/(^|\s|-)\S/g, (m) => m.toUpperCase());
    };

    const safeNom = (val) => {
        if (val === undefined || val === null) return "";
        return String(val).trim().toUpperCase();
    };

    return {
        id: row.id ? row.id.toString() : "",
        prenom: safeFormat(row.prenom),
        nom: safeNom(row.nom),
        genre: row.genre ? String(row.genre).toUpperCase().trim() : "H",
        metier: safeFormat(row.metier),
        naissance: row.naissance || "",
        lieu_n: safeFormat(row.lieu_n),
        mariage: row.mariage || "",    // <-- AJOUTÉ : Pour ne pas perdre la date
        lieu_m: safeFormat(row.lieu_m), // <-- AJOUTÉ : Pour ne pas perdre le lieu
        deces: row.deces || "",
        lieu_d: safeFormat(row.lieu_d),
        residence: safeFormat(row.residence)
    };
}).filter(p => p.id !== "");

            // --- LOGIQUE DE SAUVEGARDE ---
            let finalData = [];
            const savedRaw = localStorage.getItem('maGenealogie');
            
            if (savedRaw && JSON.parse(savedRaw).length > 0) {
                const mode = confirm("Données existantes.\nOK : REMPLACER\nAnnuler : FUSIONNER");
                if (mode) {
                    finalData = cleanedData;
                } else {
                    let existingData = JSON.parse(savedRaw);
                    cleanedData.forEach(newItem => {
                        const idx = existingData.findIndex(item => item.id.toString() === newItem.id.toString());
                        if (idx !== -1) existingData[idx] = { ...existingData[idx], ...newItem };
                        else existingData.push(newItem);
                    });
                    finalData = existingData;
                }
            } else {
                finalData = cleanedData;
            }

            localStorage.setItem('maGenealogie', JSON.stringify(finalData));
            alert("✅ Importation terminée avec mise aux normes des majuscules.");
            location.reload(); 

        } catch (e) {
            console.error("Erreur d'import :", e);
            alert("❌ Erreur lors de l'importation.");
        }
    };
}

/**
 * DESSIN DE L'ARBRE (D3.js)
 */
function drawTree() {
    if (!currentData || currentData.length === 0) return;
    const containerEl = d3.select("#tree-container");
    containerEl.selectAll("*").remove();

    const width = window.innerWidth, height = window.innerHeight;
    const svg = containerEl.append("svg")
        .attr("width", "100%").attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .call(d3.zoom().on("zoom", (e) => container.attr("transform", e.transform)));

    const container = svg.append("g");

    if (currentDirection === 'H') {
        const startX = currentOrientation === 'L' ? 150 : width - 150;
        container.attr("transform", `translate(${startX}, ${height / 2})`);
    } else {
        const startY = currentOrientation === 'T' ? 100 : height - 100;
        container.attr("transform", `translate(${width / 2}, ${startY})`);
    }

    try {
        const root = d3.stratify()
            .id(d => d.id.toString())
            .parentId(d => {
                const idNum = parseInt(d.id);
                return idNum > 1 ? Math.floor(idNum / 2).toString() : null;
            })
            (currentData);

        const treeLayout = d3.tree().nodeSize(currentDirection === 'H' ? [140, 320] : [280, 220]);
        treeLayout(root);

        container.selectAll(".link").data(root.links()).enter().append("path")
            .attr("class", "link")
            .attr("d", (currentDirection === 'H' ? d3.linkHorizontal() : d3.linkVertical())
                .x(d => {
                    let val = currentDirection === 'H' ? d.y : d.x;
                    if (currentDirection === 'H' && currentOrientation === 'R') return -val;
                    return val;
                })
                .y(d => {
                    let val = currentDirection === 'H' ? d.x : d.y;
                    if (currentDirection === 'V' && currentOrientation === 'B') return -val;
                    return val;
                })
            );

        const nodes = container.selectAll(".node").data(root.descendants()).enter().append("g")
            .attr("class", d => `node gen-G${Math.floor(Math.log2(parseInt(d.data.id))) + 1}`)
            .attr("transform", d => {
                let x = currentDirection === 'H' ? d.y : d.x;
                let y = currentDirection === 'H' ? d.x : d.y;
                if (currentDirection === 'H' && currentOrientation === 'R') x = -x;
                if (currentDirection === 'V' && currentOrientation === 'B') y = -y;
                return `translate(${x},${y})`;
            });

        nodes.append("rect")
            .attr("width", 220).attr("height", 100).attr("x", -110).attr("y", -50).attr("rx", 10)
            .style("fill", d => d.data.genre === 'F' ? "#fff0f6" : "#f0f7ff")
            .style("stroke", d => d.data.genre === 'F' ? "#ffadd2" : "#91d5ff");

        nodes.append("text").attr("y", -35).attr("text-anchor", "middle").attr("class", "node-sosa-badge")
            .text(d => `Sosa n°${d.data.id || ""}`);

        nodes.append("text").attr("text-anchor", "middle").attr("dy", -5).attr("class", "node-name")
            .text(d => {
                const prenom = d.data.prenom || "";
                const nom = d.data.nom || "INCONNU";
                return (prenom + " " + nom).trim();
            });

        nodes.append("text").attr("text-anchor", "middle").attr("dy", 15).attr("class", "node-metier")
            .text(d => d.data.metier || "");

        nodes.append("text").attr("text-anchor", "middle").attr("dy", 35).attr("class", "node-info")
            .text(d => (d.data.naissance ? `👶 ${d.data.naissance}` : "") + (d.data.deces ? ` ✝️ ${d.data.deces}` : ""));

    } catch(err) {
        console.error("Erreur D3 détaillée:", err);
    }
}

/**
 * NAVIGATION & CONTRÔLES
 */
function setDirection(dir, orientation) {
    currentDirection = dir;
    currentOrientation = orientation;
    drawTree();
}

function resetZoom() { location.reload(); }

function clearAll() {
    if(confirm("Voulez-vous vraiment TOUT supprimer ?")) {
        localStorage.removeItem('maGenealogie');
        location.reload();
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