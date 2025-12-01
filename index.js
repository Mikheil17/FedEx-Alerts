document.addEventListener("DOMContentLoaded", () => {

    const stacks = Array.from(document.querySelectorAll(".stack"));
    const container = document.querySelector(".alert-container");
    const bottomSwitch = document.getElementById("bottomSwitch");
    const bottomIcons = Array.from(bottomSwitch.querySelectorAll("img"));

    let activeIndex = null;

    /* ======================================================
       Activate a stack (zoom mode)
    ====================================================== */
    window.activateStack = function(index) {
        if (index < 0 || index >= stacks.length) return;

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
        if (e.key === "Escape") resetView();
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
