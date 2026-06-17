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
    
    // Initialisation du sélecteur au premier chargement de l'image
    initialiserSelectRacine();
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

// --- 1B. GESTION DYNAMIQUE DE LA RACINE ---
let idRacineSelectionnee = "1"; // Par défaut, l'individu avec l'ID "1"

function initialiserSelectRacine() {
    const data = JSON.parse(localStorage.getItem('maGenealogie') || "[]");
    const select = document.getElementById('select-racine');
    
    if (!select || data.length === 0) return;
    
    // On vide le sélecteur pour éviter les doublons
    select.innerHTML = "";
    
    // On trie les individus par ID ou par nom pour que ce soit plus lisible
    data.sort((a, b) => Number(a.id) - Number(b.id));
    
    data.forEach(perso => {
        const option = document.createElement('option');
        option.value = perso.id;
        option.text = `[SOSA ${perso.id}] ${perso.nom.toUpperCase()} ${perso.prenom}`;
        if (String(perso.id) === String(idRacineSelectionnee)) {
            option.selected = true;
        }
        select.appendChild(option);
    });
    
    // Événement lors du changement de racine
    select.onchange = (e) => {
        idRacineSelectionnee = e.target.value;
        genererArbre();
    };
}

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

    // Base mathématique de la racine choisie
    const R = Number(idRacineSelectionnee);

    // Calcul mathématique des correspondances de SOSA basées sur la racine choisie R
    const sosaMapping = {
        "moi":     R,
        "pere":    2 * R,
        "mere":    2 * R + 1,
        "gp_pat":  4 * R,
        "gm_pat":  4 * R + 1,
        "gp_mat":  4 * R + 2,
        "gm_mat":  4 * R + 3,
        "sosa8":   8 * R,
        "sosa9":   8 * R + 1,
        "sosa10":  8 * R + 2,
        "sosa11":  8 * R + 3,
        "sosa12":  8 * R + 4,
        "sosa13":  8 * R + 5,
        "sosa14":  8 * R + 6,
        "sosa15":  8 * R + 7
    };

    // Parcours et dessin automatique selon le nouveau mapping
    Object.keys(positionsArbre).forEach((key) => {
        const sosaIdCalculé = String(sosaMapping[key]);
        dessinerIndividu(key, sosaIdCalculé);
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
        // Définit le nom du fichier que l'utilisateur va recevoir
        link.download = 'mon_arbre_genealogique.png'; 
        
        // Transforme le canvas (fond + texte) en lien de téléchargement
        link.href = canvas.toDataURL("image/png");
        
        // Déclenche le téléchargement
        link.click();
    } catch (e) {
        // Message d'erreur si le navigateur bloque (souvent en local)
        alert("Erreur : Le navigateur bloque l'exportation. Utilisez Live Server ou publiez sur GitHub.");
    }
}

// Lancement par défaut
changerStyle('mon_arbre.jpg');