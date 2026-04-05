const canvas = document.getElementById('treeCanvas');
const ctx = canvas.getContext('2d');
const coordsDisplay = document.getElementById('coords-display');

// --- GESTION DE L'IMAGE ET DES STYLES ---
let imgArbre = new Image();

function changerStyle(nomFichier) {
    const status = document.getElementById('status-msg');
    if (status) status.innerText = "Changement de style...";
    imgArbre.src = nomFichier; 
}

imgArbre.onload = () => {
    canvas.width = imgArbre.width;
    canvas.height = imgArbre.height;
    genererArbre(); 
};

imgArbre.onerror = () => {
    console.error("Erreur : Image introuvable.");
    alert("L'image de fond n'a pas pu être chargée.");
};

// --- 1. CONFIGURATION DES EMPLACEMENTS ---
const positionsArbre = {
    "moi":      { x: 2011,  y: 2315 },
    "pere":     { x: 1011,  y: 1830 },
    "mere":     { x: 2995,  y: 1830 },
    "gp_pat":   { x: 517,   y: 1310 }, 
    "gm_pat":   { x: 1509,  y: 1310 },
    "gp_mat":   { x: 2501,  y: 1310 }, 
    "gm_mat":   { x: 3500,  y: 1310 },
    "sosa8":    { x: 303,   y: 750 }, 
    "sosa9":    { x: 723,   y: 750 }, 
    "sosa10":   { x: 1300,  y: 750 }, 
    "sosa11":   { x: 1722,  y: 750 },
    "sosa12":   { x: 2288,  y: 750 }, 
    "sosa13":   { x: 2710,  y: 750 }, 
    "sosa14":   { x: 3287,  y: 750 }, 
    "sosa15":   { x: 3710,  y: 750 }
};

// --- 2. FONCTION DE DESSIN ---
function genererArbre() {
    const data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgArbre, 0, 0);

    const dessinerIndividu = (cle, sosaId) => {
        const perso = data.find(p => String(p.id) === String(sosaId));
        const pos = positionsArbre[cle];

        if (perso && pos) {
            ctx.fillStyle = "#3a2b1a"; 
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const tailleUnique = 45; 
            const interligne = 45; 

            // 1. LE NOM
            ctx.font = `bold ${tailleUnique}px 'Georgia', serif`;
            const texteNom = (perso.nom || "NOM").toUpperCase();
            ctx.fillText(texteNom, pos.x, pos.y - (interligne * 1.5)); 

            // 2. LE PRÉNOM
            ctx.font = `normal ${tailleUnique}px 'Georgia', serif`;
            const textePrenom = perso.prenom || "Prénom";
            ctx.fillText(textePrenom, pos.x, pos.y - (interligne * 0.5));

            // 3. LA NAISSANCE
            ctx.font = `italic ${tailleUnique}px 'Georgia', serif`;
            const naissance = perso.naissance ? `° ${perso.naissance}` : "° ....";
            ctx.fillText(naissance, pos.x, pos.y + (interligne * 0.5)); 

            // 4. LE DÉCÈS
            const deces = perso.deces ? `† ${perso.deces}` : "† ....";
            ctx.fillText(deces, pos.x, pos.y + (interligne * 1.5));
        }
    };

    // Mapping des SOSA
    Object.keys(positionsArbre).forEach((key, index) => {
        // Cette boucle dessine automatiquement tout ce qui est dans positionsArbre
        // en cherchant l'ID correspondant (1, 2, 3... jusqu'à 15)
        const sosaId = (key === "moi") ? "1" : 
                       (key === "pere") ? "2" : 
                       (key === "mere") ? "3" : 
                       (key === "gp_pat") ? "4" : 
                       (key === "gm_pat") ? "5" : 
                       (key === "gp_mat") ? "6" : 
                       (key === "gm_mat") ? "7" : key.replace("sosa", "");
        
        dessinerIndividu(key, sosaId);
    });

    const status = document.getElementById('status-msg');
    if (status) status.innerText = "✅ Arbre généré avec succès";
}

// --- 3. OUTIL DE COORDONNÉES ---
canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    
    if (coordsDisplay) {
        coordsDisplay.innerHTML = `<strong>Coordonnées :</strong> X: ${x} | Y: ${y}`;
    }
    console.log(`{ x: ${x}, y: ${y} }`);
});

// --- 4. EXPORT IMAGE ---
function telechargerImage() {
    try {
        const link = document.createElement('a');
        link.download = 'mon_arbre_genealogique.png';
        link.href = canvas.toDataURL("image/png");
        link.click();
    } catch (e) {
        alert("Erreur : Le navigateur bloque l'exportation en mode local. Utilisez Live Server ou publiez sur GitHub.");
    }
}

// Lancement par défaut
changerStyle('mon_arbre.jpg');