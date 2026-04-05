const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const coordsDisplay = document.getElementById('coords-display');

/**
 * 1. CONFIGURATION DES EMPLACEMENTS
 */
const positionsArbre = {
    // SOSA 1, 2, 3
    "moi":      { x: 706,  y: 576 },
    "pere":     { x: 547,  y: 446 },
    "mere":     { x: 864,  y: 446 },

    // SOSA 4, 5, 6, 7
    "gp_pat":   { x: 315,  y: 315 }, 
    "gm_pat":   { x: 503,  y: 315 },
    "gp_mat":   { x: 912,  y: 315 }, 
    "gm_mat":   { x: 1102, y: 315 },

    // SOSA 8 à 11 (Côté Père)
    "sosa8":    { x: 184,  y: 181 }, 
    "sosa9":    { x: 330,  y: 181 }, 
    "sosa10":   { x: 482,  y: 181}, 
    "sosa11":   { x: 626,  y: 181 },

    // SOSA 12 à 15 (Côté Mère)
    "sosa12":   { x: 781,  y: 181 }, 
    "sosa13":   { x: 925,  y: 181 }, 
    "sosa14":   { x: 1076, y: 181 }, 
    "sosa15":   { x: 1223, y: 181 }
};

let imgArbre = new Image();
imgArbre.src = 'mon_arbre.jpg'; 

imgArbre.onload = () => {
    canvas.width = imgArbre.width;
    canvas.height = imgArbre.height;
    setTimeout(genererArbre, 100);
};

imgArbre.onerror = () => {
    console.error("Erreur : Image introuvable.");
};

/**
 * 2. FONCTION DE DESSIN
 */
function genererArbre() {
    const data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgArbre, 0, 0);

    ctx.fillStyle = "#3a2b1a"; 
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const dessinerIndividu = (cle, sosaId) => {
    const perso = data.find(p => String(p.id) === String(sosaId));
    const pos = positionsArbre[cle];

    if (perso && pos) {
        ctx.fillStyle = "#3a2b1a"; // Brun sépia
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const tailleUnique = 11; 
        const interligne = 13; // Espace entre chaque ligne

        // 1. LE NOM (En gras, tout en haut du bloc)
        ctx.font = `bold ${tailleUnique}px 'Georgia', serif`;
        const texteNom = (perso.nom || "NOM").toUpperCase();
        ctx.fillText(texteNom, pos.x, pos.y - (interligne * 1.5)); 

        // 2. LE PRÉNOM (Juste en dessous du nom)
        ctx.font = `normal ${tailleUnique}px 'Georgia', serif`;
        const textePrenom = perso.prenom || "Prénom";
        ctx.fillText(textePrenom, pos.x, pos.y - (interligne * 0.5));

        // 3. LA NAISSANCE (Ligne suivante)
        ctx.font = `italic ${tailleUnique}px 'Georgia', serif`;
        const naissance = perso.naissance ? `° ${perso.naissance}` : "° ....";
        ctx.fillText(naissance, pos.x, pos.y + (interligne * 0.5)); 

        // 4. LE DÉCÈS (Tout en bas du bloc)
        const deces = perso.deces ? `† ${perso.deces}` : "† ....";
        ctx.fillText(deces, pos.x, pos.y + (interligne * 1.5));
    }
};
    // Appel pour chaque membre (du SOSA 1 au SOSA 15)
    dessinerIndividu("moi", "1");
    dessinerIndividu("pere", "2");
    dessinerIndividu("mere", "3");
    dessinerIndividu("gp_pat", "4");
    dessinerIndividu("gm_pat", "5");
    dessinerIndividu("gp_mat", "6");
    dessinerIndividu("gm_mat", "7");
    dessinerIndividu("sosa8", "8");
    dessinerIndividu("sosa9", "9");
    dessinerIndividu("sosa10", "10");
    dessinerIndividu("sosa11", "11");
    dessinerIndividu("sosa12", "12");
    dessinerIndividu("sosa13", "13");
    dessinerIndividu("sosa14", "14");
    dessinerIndividu("sosa15", "15");

    const status = document.getElementById('status-msg');
    if (status) status.innerText = "✅ Arbre généré avec succès";
}

/**
 * 3. OUTIL DE COORDONNÉES
 */
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    
    if (coordsDisplay) {
        coordsDisplay.innerHTML = `<strong>Coordonnées :</strong> X: ${x} | Y: ${y}`;
    }
    console.log(`"${x}", "${y}"`);
});

/**
 * 4. EXPORT IMAGE
 */
function telechargerImage() {
    try {
        // Crée un lien invisible
        const link = document.createElement('a');
        // Nom du fichier final
        link.download = 'mon_arbre_genealogique.png';
        // Convertit le contenu du canvas en image
        link.href = canvas.toDataURL("image/png");
        // Simule un clic pour lancer le téléchargement
        link.click();
    } catch (e) {
        console.error("Erreur lors de l'exportation :", e);
        alert("Le navigateur bloque l'exportation. Si vous travaillez sur des fichiers locaux, utilisez un serveur local (comme l'extension Live Server sur VS Code) pour éviter les restrictions de sécurité.");
    }
}