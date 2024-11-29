(() => {
})();

function AddPlayerOptions(caracterOption) {
    if (!caracterOption) {
        console.error("L'élément avec l'ID spécifié n'existe pas.");
        return;
    }

    const playerLayer = caracterOption.children[1];

    if (!playerLayer) {
        console.error("Le deuxième enfant de 'caracterOption' n'existe pas.");
        return;
    }

    const gms = game?.users;
    if (!gms) {
        console.error("'game.users' est introuvable.");
        return;
    }

    let fullyHtml = `
        <fieldset>
            <legend>Party</legend>
            <div class="form-group stacked character">
                <div class="form-fields">
                    <select name="gms">
                        <option value="None"></option>
    `;
    gms.forEach((user) => {
        if (user.isGM) {
            if(game.user.getFlag('multi-party-yebou', 'partyId') === user.id) {
                fullyHtml += `<option selected value="${user.id}">${user.name}</option>`;
            } else {
                fullyHtml += `<option value="${user.id}">${user.name}</option>`;
            }       
        }
    });
    fullyHtml += `
                    </select>
                </div>
                <p class="hint">Choisie ton Maitre du Jeu, tu rejoindra automatiquement son groupe.</p>
            </div>
        </fieldset>
    `;

    playerLayer.insertAdjacentHTML('afterend', fullyHtml);

    const selectElement = document.getElementsByName("gms")[0];
    selectElement.addEventListener('change', (event) => {
        game.user.setFlag("multi-party-yebou", "partyId",  event.target.value);
    });
}

Hooks.on("renderUserConfig", (app, html, data) => {
    AddPlayerOptions(html.children[2].children[0]);
});

//----------------------------------------------

Hooks.on("renderChatMessage", (message, html, messageData) => {
    if(messageData.author.getFlag("multi-party-yebou", "partyId") != game.user.getFlag("multi-party-yebou", "partyId") ) {
        html.addClass("hardHide");
    }
});

//----------------------------------------------

Hooks.on("getImagePopoutHeaderButtons", (application, buttons) => {
    if (!game.user.isGM)
        return;
    buttons.unshift({
        label: "Show Party",
        class: "share-image-party",
        icon: "fas fa-user",
        onclick: () => {
            let users = game.users.filter(user => user.id != game.user.id && user.getFlag("multi-party-yebou", "partyId") == game.user.getFlag("multi-party-yebou", "partyId"));
            if(users.length > 0) {
                application.shareImage({users: users.map(user => user.id)});
            }
        },
        condition: li => game.user.isGM
    });
});

//----------------------------------------------

Hooks.on('getSceneNavigationContext', (html, contextMenu) => {
    contextMenu.push({
        name: "Go With Party",
        icon: '<i class="fa-solid fa-people-arrows"></i>',
        callback: li => {
            var destination = game.scenes.get(li.data("sceneId"));
            GoWithParty(destination);
        },
        condition: li => game.user.isGM
    });
});

Hooks.on('getSceneDirectoryEntryContext', (html, contextMenu) => {
    contextMenu.push({
        name: "Go With Party",
        icon: '<i class="fa-solid fa-people-arrows"></i>',
        callback: li => {
            var destination = game.scenes.get(li.data("documentId"));
            GoWithParty(destination);
        },
        condition: li => game.user.isGM
    });
});

function GoWithParty(destination){
    game.users.forEach(user => { 
        if (user.getFlag("multi-party-yebou", "partyId") == game.user.getFlag("multi-party-yebou", "partyId")) {
            game.socket.emit("pullToScene", destination.id, user.id);
        }
    });
}