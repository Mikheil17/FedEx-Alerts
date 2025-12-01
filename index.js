document.addEventListener("DOMContentLoaded", () => {

    const stacks = Array.from(document.querySelectorAll(".stack"));
    const container = document.querySelector(".alert-container");
    const bottomSwitch = document.getElementById("bottomSwitch");
    const bottomIcons = Array.from(bottomSwitch.querySelectorAll("img"));
    const hideToggle = document.getElementById("hide");
    const logo = document.getElementById("logo");
    const managerToggle = document.getElementById("manager");

    let activeIndex = null;
    let hiddenCards = []; // Store {card, stackIndex, originalParent} objects
    let showingHidden = false; // Track if we're in "show hidden" mode
    let managerMode = false; // Track if manager mode is active

    /* ======================================================
       Create and update badge for hidden count
    ====================================================== */
    const badge = document.createElement("div");
    badge.id = "hidden-badge";
    badge.style.cssText = `
        position: absolute;
        bottom: 0.5rem;
        right: -0.3rem;
        background: #FF6200;
        color: white;
        border-radius: 50%;
        width: 1rem;
        height: 1rem;
        display: none;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: bold;
        pointer-events: none;
    `;   
    
    // Wrap hide icon in a container for positioning
    const hideContainer = document.createElement("div");
    hideContainer.style.position = "relative";
    hideContainer.style.display = "inline-block";
    hideToggle.parentNode.insertBefore(hideContainer, hideToggle);
    hideContainer.appendChild(hideToggle);
    hideContainer.appendChild(badge);

    function updateBadge() {
        const count = hiddenCards.length;
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = "flex";
        } else {
            badge.style.display = "none";
        }
    }

    /* ======================================================
       Logo click - reset view
    ====================================================== */
    logo.addEventListener("click", () => {
        if (showingHidden) {
            hideToggle.click(); // Exit hidden view
        }
        resetView(); // Exit zoom mode
    });

    /* ======================================================
       Manager Mode Toggle
    ====================================================== */
    managerToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        managerMode = !managerMode;
        
        // Visual feedback for manager mode
        if (managerMode) {
            managerToggle.style.opacity = "1";
            managerToggle.style.transform = "scale(1.1)";
            // Change all hide icons to X
            document.querySelectorAll(".card-hide-icon").forEach(icon => {
                icon.dataset.originalSrc = icon.src;
                icon.src = "./Images/Icons/x.png";
                icon.style.filter = "brightness(0) invert(1)"; // Make it white
            });
        } else {
            managerToggle.style.opacity = "0.8";
            managerToggle.style.transform = "scale(1)";
            // Restore hide icons
            document.querySelectorAll(".card-hide-icon").forEach(icon => {
                if (icon.dataset.originalSrc) {
                    icon.src = icon.dataset.originalSrc;
                    icon.style.filter = "";
                }
            });
        }
    });

    /* ======================================================
       Create confirmation modal
    ====================================================== */
    function createConfirmModal(onConfirm) {
        // Create overlay
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Create modal
        const modal = document.createElement("div");
        modal.style.cssText = `
            background: #f5f5f5;
            border-radius: 0.3rem;
            border: 0.3rem solid #4D148C;
            max-width: 40rem;
            text-align: center;
            box-shadow: 0px 10px 30px rgba(0,0,0,0.5);
        `;
        
        modal.innerHTML = `
            <h2 style= "background: #4D148C; text-align: left; padding: 0.5rem; color: white; font-size: 1.5rem;">
             <img style= "width: 2rem; height: 2rem; filter: brightness(0) invert(1); margin: 0;"src="./Images/Icons/warning.png"> Warning</h2>
            <p style="margin: 1rem 2rem; font-size: 1.3rem; text-align: center">Once you commit this action, </br> it cannot be undone.</br></br> Proceed anyway?</p>
            <div style="display: flex; gap: 1rem; justify-content: space-around; margin: 0.5rem 1rem;">
                <button id="modal-cancel" style="
                    padding: 0.4rem 4rem;
                    font-size: 1.3rem;
                    border: 2px solid #666;
                    background: white;
                    color: #666;
                    border-radius: 0.8rem;
                    cursor: pointer;
                    font-weight: bold;
                ">Cancel</button>
                <button id="modal-confirm" style="
                    padding: 0.4rem 4rem;
                    font-size: 1.3rem;
                    border: none;
                    background: #4D148C;
                    color: white;
                    border-radius: 0.8rem;
                    cursor: pointer;
                    font-weight: bold;
                ">Confirm</button>
            </div>
        `;
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        // Button handlers
        const cancelBtn = modal.querySelector("#modal-cancel");
        const confirmBtn = modal.querySelector("#modal-confirm");
        
        cancelBtn.addEventListener("click", () => {
            overlay.remove();
        });
        
        confirmBtn.addEventListener("click", () => {
            overlay.remove();
            onConfirm();
        });
        
        // Click outside to cancel
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    /* ======================================================
       Activate a stack (zoom mode)
    ====================================================== */
    window.activateStack = function(index) {
        if (index < 0 || index >= stacks.length) return;
        if (showingHidden) return; // Don't allow zoom in hidden view

        activeIndex = index;

        // turn container into zoom mode
        container.classList.add("zoom-mode");

        stacks.forEach((stack, i) => {
            if (i === index) {
                stack.classList.add("active");
                stack.classList.remove("inactive");
            } else {
                stack.classList.remove("active");
                stack.classList.add("inactive");
            }
        });

        // SHOW bottom selector and hide active icon
        bottomSwitch.classList.add("active");
        bottomIcons.forEach((icon, i) => {
            icon.style.display = (i === index) ? "none" : "inline";
        });
    };

    /* ======================================================
       Rotate cards within a stack
    ====================================================== */
    function rotateCardsInStack(stack, direction) {
        const cards = Array.from(stack.querySelectorAll(".alert-card"));
        
        // Get current classes for each card
        const classes = cards.map(card => {
            if (card.classList.contains("stack-1")) return "stack-1";
            if (card.classList.contains("stack-2")) return "stack-2";
            if (card.classList.contains("stack-3")) return "stack-3";
        });

        // Rotate the classes array
        if (direction === 1) {
            // Right card clicked - bring it to front
            classes.unshift(classes.pop());
        } else {
            // Left card clicked - bring it to front
            classes.push(classes.shift());
        }

        // Apply new classes
        cards.forEach((card, i) => {
            card.classList.remove("stack-1", "stack-2", "stack-3");
            card.classList.add(classes[i]);
        });
    }

    /* ======================================================
       Reorganize cards in stack after hiding
    ====================================================== */
    function reorganizeStack(stack) {
        const cards = Array.from(stack.querySelectorAll(".alert-card"));
        const stackClasses = ["stack-1", "stack-2", "stack-3"];
        
        // Reassign classes based on remaining cards
        cards.forEach((card, index) => {
            card.classList.remove("stack-1", "stack-2", "stack-3");
            if (index < stackClasses.length) {
                card.classList.add(stackClasses[index]);
            }
        });
    }

    /* ======================================================
       Reset back to normal grid mode
    ====================================================== */
    function resetView() {
        activeIndex = null;

        container.classList.remove("zoom-mode");

        stacks.forEach(stack => {
            stack.classList.remove("active", "inactive");
        });

        bottomSwitch.classList.remove("active");
        bottomIcons.forEach(icon => icon.style.display = "inline");
    }

    /* ======================================================
       Hide/Show functionality
    ====================================================== */
    
    // Toggle to hidden cards view
    hideToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        showingHidden = !showingHidden;
        
        if (showingHidden) {
            // Enter hidden view mode
            hideToggle.style.opacity = "1";
            hideToggle.style.transform = "scale(1.1)";
            container.classList.add("hidden-view");
            resetView(); // Exit zoom mode
            
            // Clear container and show only hidden cards
            container.innerHTML = "";
            hiddenCards.forEach(hiddenItem => {
                container.appendChild(hiddenItem.card);
                hiddenItem.card.style.opacity = "1";
                hiddenItem.card.style.display = "flex";
            });
            
        } else {
            // Exit hidden view mode
            hideToggle.style.opacity = "0.8";
            hideToggle.style.transform = "scale(1)";
            container.classList.remove("hidden-view");
            
            // Restore original stacks
            container.innerHTML = "";
            stacks.forEach(stack => {
                container.appendChild(stack);
            });
            container.appendChild(bottomSwitch);
        }
    });

    // Setup hide icons for all cards (including dynamically restored ones)
    function setupHideIcon(card, stack, stackIndex) {
        const hideIcon = card.querySelector(".card-hide-icon");
        
        // Remove old listeners by cloning
        const newHideIcon = hideIcon.cloneNode(true);
        hideIcon.parentNode.replaceChild(newHideIcon, hideIcon);
        
        newHideIcon.addEventListener("click", (e) => {
            e.stopPropagation();
            
            // MANAGER MODE - DELETE PERMANENTLY
            if (managerMode) {
                createConfirmModal(() => {
                    // Permanently delete the card
                    card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.95)";
                    
                    setTimeout(() => {
                        card.remove();
                        
                        // Also remove from hiddenCards if it's there
                        const hiddenIndex = hiddenCards.findIndex(item => item.card === card);
                        if (hiddenIndex !== -1) {
                            hiddenCards.splice(hiddenIndex, 1);
                            updateBadge();
                        }
                        
                        // Reorganize remaining cards
                        reorganizeStack(stack);
                        
                        // If stack is now empty, hide it
                        if (stack.querySelectorAll(".alert-card").length === 0) {
                            stack.style.display = "none";
                            if (activeIndex === stackIndex) {
                                resetView();
                            }
                        }
                        
                        // If in hidden view and no cards left, exit
                        if (showingHidden && hiddenCards.length === 0) {
                            hideToggle.click();
                        }
                    }, 400);
                });
                return;
            }
            
            // NORMAL MODE - HIDE/RESTORE
            // If in hidden view, restore the card
            if (showingHidden) {
                // Find this card in hiddenCards array
                const hiddenIndex = hiddenCards.findIndex(item => item.card === card);
                if (hiddenIndex !== -1) {
                    const hiddenItem = hiddenCards[hiddenIndex];
                    
                    // Fade out from hidden view
                    card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.95)";
                    
                    setTimeout(() => {
                        // Remove from hidden cards array
                        hiddenCards.splice(hiddenIndex, 1);
                        
                        // Reset card styles
                        card.style.opacity = "";
                        card.style.transform = "";
                        card.style.transition = "";
                        card.style.display = "";
                        
                        // Restore to original stack
                        hiddenItem.originalParent.appendChild(card);
                        
                        // Reorganize the stack
                        reorganizeStack(hiddenItem.originalParent);
                        
                        // Show the stack again if it was hidden
                        hiddenItem.originalParent.style.display = "";
                        
                        // Remove from hidden view container
                        if (card.parentNode === container) {
                            card.remove();
                        }
                        
                        // Re-setup the hide icon for this card
                        setupHideIcon(card, hiddenItem.originalParent, hiddenItem.stackIndex);
                        
                        // Update badge count
                        updateBadge();
                        
                        // If no more hidden cards, exit hidden view
                        if (hiddenCards.length === 0) {
                            hideToggle.click();
                        }
                    }, 400);
                }
            } else {
                // Normal mode: hide the card
                // Fade out animation
                card.style.transition = "opacity 0.4s ease, transform 0.4s ease";
                card.style.opacity = "0";
                card.style.transform = "scale(0.95)";
                
                setTimeout(() => {
                    // Remove from stack and add to hidden cards with metadata
                    card.remove();
                    hiddenCards.push({
                        card: card,
                        stackIndex: stackIndex,
                        originalParent: stack
                    });
                    
                    // Reorganize remaining cards
                    reorganizeStack(stack);
                    
                    // If stack is now empty, hide the whole stack
                    if (stack.querySelectorAll(".alert-card").length === 0) {
                        stack.style.display = "none";
                        
                        // Exit zoom only if the empty stack was the active one
                        if (activeIndex === stackIndex) {
                            resetView();
                        }
                    }
                    
                    // Update badge count
                    updateBadge();
                }, 400);
            }
        });
    }

    // Initialize hide icons for all existing cards
    stacks.forEach((stack, stackIndex) => {
        const cards = stack.querySelectorAll(".alert-card");
        cards.forEach(card => {
            setupHideIcon(card, stack, stackIndex);
        });
    });

    /* Click a stack → zoom OR rotate cards if in zoom mode */
    stacks.forEach((stack, index) => {
        // Click on cards to either activate stack or rotate cards
        stack.querySelectorAll(".alert-card").forEach(card => {
            card.addEventListener("click", (e) => {
                e.stopPropagation();

                // If this stack is active (in zoom mode)
                if (stack.classList.contains("active")) {
                    // Clicking side cards rotates them to front
                    if (card.classList.contains("stack-2")) {
                        rotateCardsInStack(stack, 1); // right card → bring to center
                    } else if (card.classList.contains("stack-3")) {
                        rotateCardsInStack(stack, -1); // left card → bring to center
                    }
                    // Clicking stack-1 (center card) does nothing
                } else {
                    // Not in zoom mode, so activate this stack
                    activateStack(index);
                }
            });
        });
    });

    /* Bottom icons → switch stacks */
    bottomIcons.forEach((icon, i) => {
        icon.addEventListener("click", (e) => {
            e.stopPropagation();
            activateStack(i);
        });
    });

    /* Click outside → reset */
    document.addEventListener("click", () => {
        if (activeIndex !== null) resetView();
    });

    /* Escape → reset */
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (showingHidden) {
                // Exit hidden view
                hideToggle.click();
            } else {
                resetView();
            }
        }
    });

});

function activateNeighbor(direction) {
  if (activeIndex === null) return;

  let next = activeIndex + direction;

  // wrap around
  if (next < 0) next = stacks.length - 1;
  if (next >= stacks.length) next = 0;

  activateStack(next);
}

stacks.forEach((stack, index) => {
  stack.addEventListener("click", e => {
    e.stopPropagation();
    activateStack(index);
  });

  // Inside a stack: detect behind cards
  stack.querySelectorAll(".alert-card").forEach(card => {
    card.addEventListener("click", e => {
      e.stopPropagation();

      if (!stack.classList.contains("active")) return;

      if (card.classList.contains("stack-2")) {
        activateNeighbor(-1); // left card
      } else if (card.classList.contains("stack-3")) {
        activateNeighbor(1); // right card
      }
    });
  });
});