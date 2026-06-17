/**
 * LOGIQUE DU BLOG D'ANECDOTES - anecdotes.js
 */

document.addEventListener('DOMContentLoaded', () => {
    displayAnecdotes();

    document.getElementById('anecdote-form').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAnecdote();
    });
});

/**
 * Enregistre une anecdote dans le localStorage
 */
function saveAnecdote() {
    const title = document.getElementById('blog-title').value.trim();
    const author = document.getElementById('blog-author').value.trim();
    const category = document.getElementById('blog-category').value;
    const content = document.getElementById('blog-content').value.trim();

    // Génération de la date du jour joliment formatée
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const currentDate = new Date().toLocaleDateString('fr-FR', options);

    const newAnecdote = {
        id: Date.now().toString(), // ID unique basé sur le temps
        title,
        author,
        category,
        content,
        date: currentDate
    };

    // Récupération de l'historique
    let anecdotes = JSON.parse(localStorage.getItem('mesAnecdotes') || "[]");
    
    // On ajoute la nouvelle anecdote au DEBUT du tableau pour qu'elle apparaisse en haut du blog
    anecdotes.unshift(newAnecdote);

    // Sauvegarde
    localStorage.setItem('mesAnecdotes', JSON.stringify(anecdotes));

    // Réinitialisation du formulaire et mise à jour de l'affichage
    document.getElementById('anecdote-form').reset();
    displayAnecdotes();
}

/**
 * Affiche le flux de toutes les anecdotes
 */
function displayAnecdotes() {
    const feed = document.getElementById('blog-feed');
    if (!feed) return;
    feed.innerHTML = "";

    const anecdotes = JSON.parse(localStorage.getItem('mesAnecdotes') || "[]");

    if (anecdotes.length === 0) {
        feed.innerHTML = `
            <div class="no-post">
                <p>Pas encore d'anecdotes croustillantes ici... 🔍</p>
            </div>`;
        return;
    }

    anecdotes.forEach(post => {
        const article = document.createElement('article');
        article.className = "blog-post";
        
        // Petite couleur ou icône de tag personnalisée selon la catégorie
        let tagClass = post.category ? post.category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "general";

        article.innerHTML = `
            <div class="post-header">
                <span class="post-tag tag-${tagClass}">${post.category}</span>
                <span class="post-date">📅 ${post.date}</span>
            </div>
            <h2 class="post-title">${post.title}</h2>
            <p class="post-author">Par <strong>${post.author}</strong></p>
            <div class="post-content">
                <p>${post.content.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="post-actions">
                <button class="delete-post-btn" onclick="deleteAnecdote('${post.id}')">Effacer ce souvenir 🗑️</button>
            </div>
        `;
        feed.appendChild(article);
    });
}

/**
 * Supprime un post du blog
 */
function deleteAnecdote(id) {
    if (!confirm("Es-tu sûre de vouloir effacer ce souvenir ? 😢")) return;

    let anecdotes = JSON.parse(localStorage.getItem('mesAnecdotes') || "[]");
    anecdotes = anecdotes.filter(item => item.id !== id);

    localStorage.setItem('mesAnecdotes', JSON.stringify(anecdotes));
    displayAnecdotes();
}